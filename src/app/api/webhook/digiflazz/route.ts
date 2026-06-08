import { NextResponse } from "next/server";
import db from "@/lib/db";
import { sendWAMessage } from "@/lib/wahaHelper";
import { generateTRXMessage } from "@/lib/trx-helper";

export async function POST(req: Request) {
  try {
    const forwarded = req.headers.get("x-forwarded-for");
    let clientIp = forwarded ? forwarded.split(/, /)[0] : "unknown";

    // Handle IPv6-mapped IPv4 (::ffff:1.2.3.4)
    if (clientIp.startsWith("::ffff:")) {
      clientIp = clientIp.replace("::ffff:", "");
    }
    
    // Allow multiple IPs (comma separated) or default
    const allowedIps = (process.env.WHITELIST_IP || "52.74.250.133").split(",").map(ip => ip.trim());

    if (!allowedIps.includes(clientIp) && process.env.NODE_ENV === "production") {
      console.warn(`[Webhook] Unauthorized access attempt from IP: ${clientIp}`);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await req.json();
    console.log("[Webhook] Received Digiflazz Payload:", JSON.stringify(data, null, 2));

    const payload = data.data || {};
    const { ref_id, status, sn, price, message, rc } = payload;
    
    const normalizedRefId = ref_id?.toUpperCase() || "";
    const statusLower = status?.toLowerCase() || "";

    if (normalizedRefId.startsWith("PLN")) {
      // Logic for PLN
      const trx = await db("trx_pln").where("ref_id", ref_id).first();
      if (!trx) return NextResponse.json({ message: "TRX not found" });

      const asset = await db("assets_pln").where("id", trx.asset_id).first();

      let finalStatus = "PENDING";
      // Check for RC=00 OR status text variations
      if (rc === '00' || statusLower === "success" || statusLower === "sukses" || statusLower === "berhasil") {
        finalStatus = "SUCCESS";
      } else if (rc === '01' || rc === '02' || statusLower === "fail" || statusLower === "gagal") {
        finalStatus = "FAILED";
      }

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
      // Check for RC=00 OR status text variations
      if (rc === '00' || statusLower === "success" || statusLower === "sukses" || statusLower === "berhasil") {
        finalStatus = "SUCCESS";
      } else if (rc === '01' || rc === '02' || statusLower === "fail" || statusLower === "gagal") {
        finalStatus = "FAILED";
      }

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
    } else if (normalizedRefId.startsWith("EMN")) {
      // Logic for E-Money
      const trx = await db("trx_emoney").where("ref_id", ref_id).first();
      if (!trx) return NextResponse.json({ message: "TRX not found" });

      let finalStatus = "PENDING";
      if (rc === '00' || statusLower === "success" || statusLower === "sukses" || statusLower === "berhasil") {
        finalStatus = "SUCCESS";
      } else if (rc === '01' || rc === '02' || statusLower === "fail" || statusLower === "gagal") {
        finalStatus = "FAILED";
      }

      await db("trx_emoney").where("ref_id", ref_id).update({
        status: finalStatus,
        sn: sn,
        price: price,
        message: message,
        raw_response: JSON.stringify(data),
        updated_at: db.fn.now(),
      });
    }

    return NextResponse.json({ message: "Webhook processed" });
  } catch (error: any) {
    console.error("[Webhook] Error processing request:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
