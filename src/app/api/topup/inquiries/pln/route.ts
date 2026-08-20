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
    const { customer_no } = body;

    if (!customer_no) {
      return NextResponse.json({ success: false, error: "Nomor meter / ID pelanggan PLN wajib diisi" }, { status: 400 });
    }

    const result = await topupOrchestrator.checkPlnSubscriber(customer_no);

    return NextResponse.json({
      success: result.success,
      data: {
        customer_no: result.customer_no,
        meter_no: result.meter_no,
        subscriber_id: result.subscriber_id,
        name: result.name,
        segment_power: result.segment_power,
      },
      message: result.message,
    });
  } catch (error: any) {
    console.error("PLN Subscriber Check Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Gagal memeriksa ID PLN" }, { status: 400 });
  }
}
