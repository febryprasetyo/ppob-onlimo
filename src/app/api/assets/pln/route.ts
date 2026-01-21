import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { 
      nama_stasiun, 
      meter_number, 
      operator_wa, 
      customer_name, 
      segment_power 
    } = await req.json();

    if (!nama_stasiun || !meter_number || !operator_wa) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    const [id] = await db("assets_pln").insert({
      nama_stasiun,
      meter_number,
      operator_wa,
      customer_name,
      segment_power
    }).returning("id");

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
