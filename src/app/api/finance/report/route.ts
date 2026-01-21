import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  if (!month || !year) {
    return NextResponse.json({ error: "Month and year are required" }, { status: 400 });
  }

  try {
    const startDate = `${year}-${month.padStart(2, "0")}-01`;
    const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];

    const plnTrx = await db("trx_pln")
      .join("assets_pln", "trx_pln.asset_id", "assets_pln.id")
      .select(
        "trx_pln.created_at",
        "assets_pln.nama_stasiun as asset_name",
        "trx_pln.token_sn as detail",
        "trx_pln.status",
        "trx_pln.price"
      )
      .whereBetween("trx_pln.created_at", [startDate + " 00:00:00", endDate + " 23:59:59"])
      .andWhere("trx_pln.status", "SUCCESS");

    const orbitTrx = await db("trx_orbit")
      .join("assets_orbit", "trx_orbit.asset_id", "assets_orbit.id")
      .select(
        "trx_orbit.created_at",
        "assets_orbit.nama_stasiun as asset_name",
        "trx_orbit.sn_ref as detail",
        "trx_orbit.status",
        "trx_orbit.price"
      )
      .whereBetween("trx_orbit.created_at", [startDate + " 00:00:00", endDate + " 23:59:59"])
      .andWhere("trx_orbit.status", "SUCCESS");

    const allTrx = [...plnTrx.map(t => ({ ...t, category: 'PLN' })), ...orbitTrx.map(t => ({ ...t, category: 'ORBIT' }))];
    allTrx.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const summary = {
      pln: plnTrx.reduce((acc, curr) => acc + Number(curr.price), 0),
      orbit: orbitTrx.reduce((acc, curr) => acc + Number(curr.price), 0),
      total: 0
    };
    summary.total = summary.pln + summary.orbit;

    return NextResponse.json({
      success: true,
      data: {
        summary,
        details: allTrx
      }
    });
  } catch (error: any) {
    console.error("Report Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
