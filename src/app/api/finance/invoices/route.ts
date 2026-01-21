import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    const invoices = await db("invoices").orderBy("created_at", "desc");
    return NextResponse.json({ success: true, data: invoices });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
