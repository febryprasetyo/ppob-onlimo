import { NextResponse } from "next/server";
import db from "@/lib/db";
import { sendWAMessage } from "@/lib/wahaHelper";
import { generateTRXMessage } from "@/lib/trx-helper";

export async function POST(req: Request) {
  try {
    const forwarded = req.headers.get("x-forwarded-for");
    const clientIp = forwarded ? forwarded.split(/, /)[0] : "unknown";
    const allowedIp = process.env.WHITELIST_IP || "52.74.250.133";

    if (clientIp !== allowedIp && process.env.NODE_ENV === "production") {
      console.warn(`Unauthorized access attempt from IP: ${clientIp}`);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await req.json();
    const payload = data.data || {};
    const { ref_id, status, sn, price, message } = payload;
    
    const normalizedRefId = ref_id?.toUpperCase() || "";

    if (normalizedRefId.startsWith("PLN")) {
      // Logic for PLN
      const trx = await db("trx_pln").where("ref_id", ref_id).first();
      if (!trx) return NextResponse.json({ message: "TRX not found" });

      const asset = await db("assets_pln").where("id", trx.asset_id).first();

      let finalStatus = "PENDING";
      if (status === "Success") finalStatus = "SUCCESS";
      if (status === "Fail") finalStatus = "FAILED";

      const updateData: any = {
        status: finalStatus,
        token_sn: sn,
        price: price,
        message: message,
        raw_response: JSON.stringify(data),
        updated_at: db.fn.now(),
      };

      if (finalStatus === "SUCCESS") {
        const fullTrx = { ...trx, token_sn: sn };
        const msg = await generateTRXMessage("PLN", asset, fullTrx);
        const waSent = await sendWAMessage(asset.operator_wa, msg);
        if (waSent) {
          updateData.wa_sent_at = db.fn.now();
        }
      }

      await db("trx_pln").where("ref_id", ref_id).update(updateData);
      
      // Update asset status
      await db("assets_pln").where({ id: trx.asset_id }).update({
        last_trx_status: finalStatus,
        last_trx_at: db.fn.now()
      });
    } else if (normalizedRefId.startsWith("ORB")) {
      // Logic for Orbit
      const trx = await db("trx_orbit").where("ref_id", ref_id).first();
      if (!trx) return NextResponse.json({ message: "TRX not found" });

      const asset = await db("assets_orbit").where("id", trx.asset_id).first();

      let finalStatus = "PENDING";
      if (status === "Success") finalStatus = "SUCCESS";
      if (status === "Fail") finalStatus = "FAILED";

      const updateData: any = {
        status: finalStatus,
        sn_ref: sn,
        price: price,
        message: message,
        raw_response: JSON.stringify(data),
        updated_at: db.fn.now(),
      };

      if (finalStatus === "SUCCESS") {
        const msg = await generateTRXMessage("ORBIT", asset, trx);
        const waSent = await sendWAMessage(asset.operator_wa, msg);
        if (waSent) {
          updateData.wa_sent_at = db.fn.now();
        }
      }

      await db("trx_orbit").where("ref_id", ref_id).update(updateData);

      // Update asset status
      await db("assets_orbit").where({ id: trx.asset_id }).update({
        last_trx_status: finalStatus,
        last_trx_at: db.fn.now()
      });
    }

    return NextResponse.json({ message: "Webhook processed" });
  } catch (error: any) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
