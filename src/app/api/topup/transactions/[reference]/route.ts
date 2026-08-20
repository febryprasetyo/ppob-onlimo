import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ reference: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { reference } = await params;
    const tx = await db("topup_transactions").where({ reference }).first();

    if (!tx) {
      return NextResponse.json({ success: false, error: "Transaksi tidak ditemukan" }, { status: 404 });
    }

    const events = await db("topup_transaction_events")
      .where({ transaction_reference: reference })
      .orderBy("created_at", "asc");

    return NextResponse.json({
      success: true,
      data: {
        reference: tx.reference,
        category: tx.category,
        flow_type: tx.flow_type,
        customer_target: tx.customer_target,
        product_snapshot: typeof tx.product_snapshot === "string" ? JSON.parse(tx.product_snapshot) : tx.product_snapshot,
        final_price: Number(tx.final_price_snapshot),
        deposit_price: session.role === "admin" ? Number(tx.deposit_price_snapshot) : undefined,
        admin_fee: Number(tx.admin_snapshot),
        commission: session.role === "admin" ? Number(tx.commission_snapshot) : undefined,
        status: tx.status,
        operator_username: tx.operator_username,
        supplier_reference: tx.supplier_reference,
        serial_number: tx.serial_number,
        token: tx.token,
        supplier_message: tx.supplier_message,
        submitted_at: tx.submitted_at,
        completed_at: tx.completed_at,
        created_at: tx.created_at,
        updated_at: tx.updated_at,
        events: events.map((ev) => ({
          id: ev.id,
          event_type: ev.event_type,
          old_status: ev.old_status,
          new_status: ev.new_status,
          actor: ev.actor,
          created_at: ev.created_at,
        })),
      },
    });
  } catch (error: any) {
    console.error("Topup Transaction Detail Error:", error);
    return NextResponse.json({ success: false, error: "Gagal memuat detail transaksi" }, { status: 500 });
  }
}
