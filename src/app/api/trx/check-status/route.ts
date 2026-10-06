import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getDigiflazzSign } from "@/lib/digiflazz-signer";
import { DIGIFLAZZ_CONFIG } from "@/lib/digiflazz-config";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  let refId = searchParams.get("ref_id");
  const assetId = searchParams.get("asset_id");
  const type = searchParams.get("type"); // PLN or ORBIT

  if ((!refId && !assetId) || !type) {
    return NextResponse.json({ error: "ref_id (or asset_id) and type are required" }, { status: 400 });
  }

  try {
    const table = type === "PLN" ? "trx_pln" : "trx_orbit";
    let trx;

    if (refId) {
      trx = await db(table).where("ref_id", refId).first();
    } else if (assetId) {
      trx = await db(table).where("asset_id", assetId).orderBy("created_at", "desc").first();
      if (trx) refId = trx.ref_id;
    }

    if (!trx || !refId) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // Always fetch latest from Digiflazz for "PENDING"
    const sign = getDigiflazzSign(refId);
    const payload = {
      username: DIGIFLAZZ_CONFIG.username,
      ref_id: refId,
      sign: sign
    };

    console.log(`>>> CHECK STATUS REQUEST (${type}):`, JSON.stringify(payload, null, 2));

    const response = await fetch("https://api.digiflazz.com/v1/transaction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const resJson = await response.json();
    const data = resJson.data || {};
    console.log(`<<< CHECK STATUS RESPONSE (${type}):`, JSON.stringify(resJson, null, 2));

    // Update DB if status changed
    const rc = String(data.rc || "").trim();
    const statusStr = String(data.status || "").toLowerCase().trim();

    let finalStatus = trx.status;
    if (rc === "00" || statusStr === "sukses" || statusStr === "success") {
      finalStatus = "SUCCESS";
    } else if (rc === "03" || statusStr === "pending" || statusStr === "proses") {
      finalStatus = "PENDING";
    } else if (rc || statusStr === "gagal" || statusStr === "batal" || statusStr === "failed") {
      finalStatus = "FAILED";
    }

    if (finalStatus !== trx.status || data.sn) {
      console.log(`[Check Status] Updating ${refId} status to ${finalStatus} (RC: ${data.rc})`);

      const updateData: any = {
        status: finalStatus,
        price: data.price || trx.price,
        message: data.message || trx.message,
        raw_response: JSON.stringify(resJson),
        updated_at: db.fn.now()
      };

      if (type === "PLN") {
        updateData.token_sn = data.sn || trx.token_sn;
      } else {
        updateData.sn_ref = data.sn || trx.sn_ref;
      }

      await db(table).where({ ref_id: refId }).update(updateData);

      // Update asset status
      const assetTable = type === "PLN" ? "assets_pln" : "assets_orbit";
      await db(assetTable).where({ id: trx.asset_id }).update({
        last_trx_status: finalStatus,
        last_trx_at: db.fn.now()
      });
      
      return NextResponse.json({ 
        success: true, 
        ref_id: refId,
        status: finalStatus,
        data: data 
      });
    }

    return NextResponse.json({ 
      success: true, 
      ref_id: refId,
      status: trx.status,
      data: data 
    });

  } catch (error: any) {
    console.error("Check Status Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
