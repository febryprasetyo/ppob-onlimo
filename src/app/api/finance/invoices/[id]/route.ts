import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const invoice = await db("invoices").where("id", id).first();
    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    const items = await db("invoice_items").where("invoice_id", id);

    return NextResponse.json({ ...invoice, items });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { status } = await req.json();
    await db("invoices").where("id", id).update({ 
      status,
      updated_at: db.fn.now()
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
