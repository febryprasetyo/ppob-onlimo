import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { topupOrchestrator } from "@/lib/topup/topup-orchestrator";

export async function POST(req: Request, { params }: { params: Promise<{ reference: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { reference } = await params;
    const result = await topupOrchestrator.reconcilePendingStatus(reference);

    return NextResponse.json({
      success: result.success,
      data: {
        reference: result.transaction.reference,
        status: result.transaction.status,
        supplier_message: result.transaction.supplier_message,
        serial_number: result.transaction.serial_number,
        token: result.transaction.token,
        completed_at: result.transaction.completed_at,
        updated_at: result.transaction.updated_at,
      },
      message: result.message,
    });
  } catch (error: any) {
    console.error("Status Check Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Gagal melakukan pengecekan status ke supplier" }, { status: 400 });
  }
}
