import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getDigiflazzBalance } from "@/lib/digiflazzHelper";

export async function GET() {
  try {
    // 1. Check Digiflazz Connection
    let digiflazzStatus = "ONLINE";
    let digiflazzBalance = 0;
    try {
      digiflazzBalance = await getDigiflazzBalance();
    } catch (error) {
      digiflazzStatus = "OFFLINE";
    }

    // 2. Check WAHA Connection (Simple ping/config check)
    const WAHA_URL = process.env.WAHA_URL;
    let wahaStatus = WAHA_URL ? "ONLINE" : "OFFLINE";
    
    // We could do a real fetch to WAHA here, but a config check is a good start
    // If WAHA is configured, we assume it's offline if it fails to respond
    if (WAHA_URL) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout
        const wahaPing = await fetch(WAHA_URL.replace("/api/sendText", "/api/sessions"), { 
          signal: controller.signal,
          headers: { "X-Api-Key": process.env.WAHA_API_KEY || "" }
        });
        clearTimeout(timeoutId);
        if (!wahaPing.ok) wahaStatus = "OFFLINE";
      } catch (e) {
        wahaStatus = "OFFLINE";
      }
    }

    // 3. Station Stats
    const totalPln = await db("assets_pln").count("id as count").first();
    const totalOrbit = await db("assets_orbit").count("id as count").first();

    // 4. Transaction Performance (last 24h)
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const trxPln24h = await db("trx_pln")
      .where("created_at", ">=", last24h)
      .select("status");
    const trxOrbit24h = await db("trx_orbit")
      .where("created_at", ">=", last24h)
      .select("status");

    const allTrx = [...trxPln24h, ...trxOrbit24h];
    const totalTrx = allTrx.length;
    const successTrx = allTrx.filter(t => t.status === "SUCCESS").length;
    const pendingTrx = allTrx.filter(t => t.status === "PENDING").length;
    const failedTrx = allTrx.filter(t => t.status === "FAILED").length;
    
    const successRate = totalTrx > 0 ? Math.round((successTrx / totalTrx) * 100) : 100;

    return NextResponse.json({
      gateways: [
        { name: "PPOB Gateway", status: digiflazzStatus, provider: "Digiflazz", balance: digiflazzBalance },
        { name: "Notification", status: wahaStatus, provider: "WAHA (WhatsApp)", session: "default" }
      ],
      operations: {
        total_stations: Number(totalPln?.count || 0) + Number(totalOrbit?.count || 0),
        pln_stations: Number(totalPln?.count || 0),
        orbit_stations: Number(totalOrbit?.count || 0),
      },
      performance: {
        last_24h_success_rate: successRate,
        pending_transactions: pendingTrx,
        failed_transactions: failedTrx,
        total_transactions_24h: totalTrx
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
