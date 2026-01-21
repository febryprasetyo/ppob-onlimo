import { NextResponse } from "next/server";
import db from "@/lib/db";
import { digiflazzRequest } from "@/lib/digiflazzHelper";

export async function POST(req: Request) {
  try {
    const { asset_id, sku } = await req.json();

    const asset = await db("assets_pln").where("id", asset_id).first();
    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    const ref_id = `PLN-${Date.now()}`;

    // Create record in DB
    await db("trx_pln").insert({
      ref_id,
      asset_id,
      sku,
      price: 0, 
      status: "PENDING",
    });

    // Request to Digiflazz
    const result = await digiflazzRequest(sku, asset.meter_number, ref_id);
    const data = result.data || {};

    // Update status based on response
    let status = "PENDING";
    if (data.rc === '00') {
      status = "SUCCESS";
    } else if (data.rc === '01' || data.rc === '02') {
      status = "FAILED";
    }

    await db("trx_pln").where({ ref_id }).update({
      status,
      token_sn: data.sn,
      price: data.price || 0,
      message: data.message,
      raw_response: JSON.stringify(result),
      updated_at: db.fn.now()
    });

    // Update asset status
    await db("assets_pln").where({ id: asset_id }).update({
      last_trx_status: status,
      last_trx_at: db.fn.now()
    });

    return NextResponse.json({ 
      success: true, 
      ref_id, 
      data: {
        status: data.status,
        rc: data.rc,
        sn: data.sn,
        message: data.message,
        price: data.price,
        customer_no: data.customer_no,
        buyer_sku_code: data.buyer_sku_code
      }
    });
  } catch (error: any) {
    console.error("Transcation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
