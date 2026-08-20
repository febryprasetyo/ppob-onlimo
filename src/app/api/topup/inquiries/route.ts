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
    const { product_id, customer_target, amount } = body;

    if (!product_id || !customer_target) {
      return NextResponse.json({ success: false, error: "Product ID dan nomor / ID tujuan wajib diisi" }, { status: 400 });
    }

    const result = await topupOrchestrator.processBillInquiry({
      productId: product_id,
      customerTarget: customer_target,
      amount: amount ? Number(amount) : undefined,
      operatorUsername: session.username,
    });

    return NextResponse.json({
      success: true,
      data: {
        inquiry_id: result.inquiry.id,
        supplier_ref_id: result.inquiry.supplier_ref_id,
        customer_target: result.inquiry.customer_target,
        customer_name: result.inquiry.customer_name,
        input_amount: result.inquiry.input_amount,
        final_price: Number(result.inquiry.final_price),
        deposit_price: Number(result.inquiry.deposit_price),
        admin_fee: Number(result.inquiry.admin_fee),
        commission: Number(result.inquiry.commission),
        bill_period: result.inquiry.bill_period,
        details: typeof result.inquiry.detail_snapshot === "string" ? JSON.parse(result.inquiry.detail_snapshot) : result.inquiry.detail_snapshot,
        expires_at: result.inquiry.expires_at,
        inquiry_date: result.inquiry.inquiry_date,
      },
      message: result.message,
    });
  } catch (error: any) {
    console.error("Bill Inquiry API Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Gagal melakukan inquiry tagihan" }, { status: 400 });
  }
}
