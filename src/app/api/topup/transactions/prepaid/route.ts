import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { topupOrchestrator } from "@/lib/topup/topup-orchestrator";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { product_id, customer_target, idempotency_key } = body;

    if (!product_id || !customer_target) {
      return NextResponse.json({ success: false, error: "Product ID dan nomor / ID tujuan wajib diisi" }, { status: 400 });
    }

    const idemKey = idempotency_key || `idem-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const result = await topupOrchestrator.processPrepaidTransaction({
      productId: product_id,
      customerTarget: customer_target,
      idempotencyKey: idemKey,
      operatorUsername: session.username,
    });

    const tx = result.transaction;
    const snapshot = typeof tx.product_snapshot === "string" ? JSON.parse(tx.product_snapshot) : tx.product_snapshot;

    return NextResponse.json({
      success: result.success,
      data: {
        reference: tx.reference,
        status: tx.status,
        product_name: snapshot.name,
        category: tx.category,
        customer_target: tx.customer_target,
        final_price: Number(tx.final_price_snapshot),
        supplier_message: tx.supplier_message,
        serial_number: tx.serial_number,
        token: tx.token,
        submitted_at: tx.submitted_at,
        completed_at: tx.completed_at,
      },
      message: result.message,
    });
  } catch (error: any) {
    console.error("Prepaid Transaction API Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Gagal memproses transaksi prabayar" }, { status: 400 });
  }
}
