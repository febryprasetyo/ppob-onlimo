import { NextResponse } from "next/server";
import db from "@/lib/db";
import { digiflazzRequest } from "@/lib/digiflazzHelper";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { phone_number, sku, brand, product_name } = await req.json();

    if (!phone_number || !sku) {
      return NextResponse.json({ error: "Phone number and SKU are required" }, { status: 400 });
    }

    const ref_id = `EMN-${Date.now()}`;

    // 1. Create record in DB
    await db("trx_emoney").insert({
      ref_id,
      customer_no: phone_number,
      product_name,
      brand,
      sku,
      price: 0, // Will be updated from response
      status: "PENDING",
      created_at: db.fn.now(),
      updated_at: db.fn.now()
    });

    // 2. Request to Digiflazz
    const result = await digiflazzRequest(sku, phone_number, ref_id);
    const data = result.data || {};

    // 3. Update status based on response
    let status = "PENDING";
    if (data.rc === '00' || data.status === 'Sukses' || data.status === 'Success') {
      status = "SUCCESS";
    } else if (data.rc === '01' || data.rc === '02') {
      status = "FAILED";
    }

    await db("trx_emoney").where({ ref_id }).update({
      status,
      sn: data.sn || data.ref_id,
      price: data.price || 0,
      message: data.message || result.message,
      raw_response: JSON.stringify(result),
      updated_at: db.fn.now()
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
    console.error("E-Money Transaction Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
