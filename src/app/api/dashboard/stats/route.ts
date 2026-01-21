import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getDigiflazzBalance } from "@/lib/digiflazzHelper";

export async function GET() {
  try {
    const balance = await getDigiflazzBalance();

    // unbilled_total: Sum of price where status = 'SUCCESS' AND is_billed = false
    const unbilledPln = await db("trx_pln")
      .where({ status: "SUCCESS", is_billed: false })
      .sum("price as total")
      .first();
    const unbilledOrbit = await db("trx_orbit")
      .where({ status: "SUCCESS", is_billed: false })
      .sum("price as total")
      .first();

    const totalUnbilled = (Number(unbilledPln?.total) || 0) + (Number(unbilledOrbit?.total) || 0);

    // monthly_spending: Sum of price where status = 'SUCCESS' in current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyPln = await db("trx_pln")
      .where("status", "SUCCESS")
      .andWhere("created_at", ">=", startOfMonth)
      .sum("price as total")
      .first();
    const monthlyOrbit = await db("trx_orbit")
      .where("status", "SUCCESS")
      .andWhere("created_at", ">=", startOfMonth)
      .sum("price as total")
      .first();

    const totalMonthly = (Number(monthlyPln?.total) || 0) + (Number(monthlyOrbit?.total) || 0);

    return NextResponse.json({
      digiflazz_balance: balance,
      unbilled_total: totalUnbilled,
      monthly_spending: totalMonthly,
      month_name: new Intl.DateTimeFormat("id-ID", { month: "long" }).format(new Date()),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
