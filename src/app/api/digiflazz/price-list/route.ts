import { NextResponse } from "next/server";
import { getPriceList, syncPriceListToDb } from "@/lib/digiflazz-service";

export async function GET(req: Request) {
  try {
    const result = await getPriceList();
    
    return NextResponse.json({ 
      success: result.success, 
      data: result.data,
      message: result.message
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const result = await syncPriceListToDb();
    
    return NextResponse.json({ 
      success: result.success, 
      message: result.message || `Berhasil sinkronisasi ${result.count} produk`,
      count: result.count
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
