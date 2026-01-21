import { NextResponse } from "next/server";
import db from "@/lib/db";
import { sendWAMessage } from "@/lib/wahaHelper";
import { generateTRXMessage } from "@/lib/trx-helper";

export async function POST(req: Request) {
  try {
    const { ref_id } = await req.json();
    console.log(`[ResendWA] Request for ref_id: ${ref_id}`);

    let trx;
    let type: "PLN" | "ORBIT";
    let asset;
    
    // Fix: ref_id starts with PLN or ORB (no dash)
    if (ref_id.toUpperCase().startsWith("PLN")) {
      type = "PLN";
      trx = await db("trx_pln").where("ref_id", ref_id).first();
      if (trx) {
        asset = await db("assets_pln").where("id", trx.asset_id).first();
      }
    } else {
      type = "ORBIT";
      trx = await db("trx_orbit").where("ref_id", ref_id).first();
      if (trx) {
        asset = await db("assets_orbit").where("id", trx.asset_id).first();
      }
    }

    if (!trx) {
      console.error(`[ResendWA] Transaction not found for ref_id: ${ref_id}`);
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    if (!asset) {
      console.error(`[ResendWA] Asset not found for trx id: ${trx.id}, asset_id: ${trx.asset_id}`);
      return NextResponse.json({ error: "Linked asset reference not found (Deleted?)" }, { status: 404 });
    }

    if (trx.status !== "SUCCESS") {
      return NextResponse.json({ error: "Only successful transactions can be sent" }, { status: 400 });
    }

    console.log(`[ResendWA] Generating message for ${type}, Asset: ${asset.nama_stasiun}`);
    let finalMessage = "";
    try {
        finalMessage = await generateTRXMessage(type, asset, trx);
    } catch (msgError: any) {
        console.error(`[ResendWA] Message Generation Error:`, msgError);
        return NextResponse.json({ error: "Failed to generate message template: " + msgError.message }, { status: 500 });
    }

    console.log(`[ResendWA] Sending to ${asset.operator_wa}...`);
    const waSent = await sendWAMessage(asset.operator_wa, finalMessage);
    
    if (waSent) {
      const table = type === "PLN" ? "trx_pln" : "trx_orbit";
      await db(table).where("ref_id", ref_id).update({
        wa_sent_at: db.fn.now(),
      });
      console.log(`[ResendWA] Success!`);
      return NextResponse.json({ success: true });
    } else {
      console.error(`[ResendWA] WAHA Service returned false`);
      return NextResponse.json({ error: "Failed to send WhatsApp message (WAHA Service Error)" }, { status: 500 });
    }
  } catch (error: any) {
    console.error("[ResendWA] Critical Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
