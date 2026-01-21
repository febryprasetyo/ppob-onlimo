import { NextResponse } from "next/server";
import { inquiryPln } from "@/lib/digiflazz-service";

export async function POST(req: Request) {
  try {
    const { customer_no } = await req.json();
    if (!customer_no) {
      return NextResponse.json({ error: "Nomor Pelanggan diperlukan" }, { status: 400 });
    }

    const result = await inquiryPln(customer_no);
    console.log("Digiflazz Inquiry Result:", JSON.stringify(result));
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        data: {
          customer_name: result.customer_name,
          customer_no: result.customer_no,
          meter_no: result.meter_no,
          subscriber_id: result.subscriber_id,
          segment_power: result.segment_power,
          name: result.name,
        }
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: `${result.message} (RC: ${result.rc})`,
        debug: result.raw
      }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ 
      success: false,
      error: error.message || "Internal Server Error"
    }, { status: 500 });
  }
}
