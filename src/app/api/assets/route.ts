import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const plnAssets = await db("assets_pln").select("*");
    const orbitAssets = await db("assets_orbit").select("*");

    // Map unique stations
    const stationsMap: Record<string, any> = {};

    plnAssets.forEach(p => {
      stationsMap[p.nama_stasiun] = {
        nama_stasiun: p.nama_stasiun,
        meter_number: p.meter_number,
        customer_name: p.customer_name,
        segment_power: p.segment_power,
        pln_sku: p.default_sku,
        phone_number: "",
        operator_wa: p.operator_wa,
        pln_id: p.id
      };
    });

    orbitAssets.forEach(o => {
      if (stationsMap[o.nama_stasiun]) {
        stationsMap[o.nama_stasiun].phone_number = o.phone_number;
        stationsMap[o.nama_stasiun].orbit_sku = o.default_sku;
        stationsMap[o.nama_stasiun].orbit_id = o.id;
        if (o.operator_wa) stationsMap[o.nama_stasiun].operator_wa = o.operator_wa;
      } else {
        stationsMap[o.nama_stasiun] = {
          nama_stasiun: o.nama_stasiun,
          meter_number: "",
          customer_name: "",
          segment_power: "",
          phone_number: o.phone_number,
          orbit_sku: o.default_sku,
          operator_wa: o.operator_wa,
          orbit_id: o.id
        };
      }
    });

    const result = Object.values(stationsMap);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
