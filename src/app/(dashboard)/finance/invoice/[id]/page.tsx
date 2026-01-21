import db from "@/lib/db";
import { InvoiceView } from "@/components/finance/invoice-view";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const invoice = await db("invoices").where("id", id).first();
  if (!invoice) {
    notFound();
  }

  const items = await db("invoice_items").where("invoice_id", id);
  const fullInvoice = { ...invoice, items };

  return (
    <div className="bg-white min-h-screen">
      <InvoiceView invoice={fullInvoice} />
    </div>
  );
}
