"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface InvoiceItem {
  id: number;
  category: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Invoice {
  id: string;
  invoice_no: string;
  period: string;
  total_amount: number;
  status: string;
  created_at: string;
  items: InvoiceItem[];
}

export function InvoiceView({ invoice }: { invoice: Invoice }) {
  const handlePrint = () => {
    window.print();
  };

  const periodDate = new Date(invoice.period);
  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  return (
    <div className="bg-white">
      <div className="flex justify-between p-6 border-b no-print bg-slate-50">
        <Link href="/finance">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Button>
        </Link>
        <Button onClick={handlePrint} variant="default" className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Printer className="h-4 w-4" /> Cetak PDF
        </Button>
      </div>

      <div id="print-area" className="p-8 md:p-12 min-h-[800px] text-slate-800 font-serif">
        {/* Kop Surat */}
        <div className="flex justify-between items-start border-b-4 border-slate-900 pb-6 mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-slate-900 mb-1">ONLIMO OPERATIONAL</h1>
            <p className="text-sm font-bold uppercase tracking-widest text-slate-500">PPOB Internal Management System</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold uppercase">PENGAJUAN DEPOSIT</h2>
            <p className="font-mono text-sm">{invoice.invoice_no}</p>
          </div>
        </div>

        {/* Info Box */}
        <div className="grid grid-cols-2 gap-8 mb-12">
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Diajukan Kepada:</p>
            <p className="font-bold text-lg">Finance Department</p>
            <p className="text-sm">KLHK Data Center Operational</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Periode Anggaran:</p>
            <p className="font-bold text-lg">{monthNames[periodDate.getMonth()]} {periodDate.getFullYear()}</p>
            <p className="text-sm">Tanggal: {new Date(invoice.created_at).toLocaleDateString("id-ID")}</p>
          </div>
        </div>

        {/* Status Badge (for screen only) */}
        <div className="mb-6 no-print">
           <Badge className={
             invoice.status === "PAID" ? "bg-green-100 text-green-700 hover:bg-green-100" :
             invoice.status === "CANCELLED" ? "bg-red-100 text-red-700 hover:bg-red-100" :
             "bg-amber-100 text-amber-700 hover:bg-amber-100"
           }>
             STATUS: {invoice.status}
           </Badge>
        </div>

        {/* Table Item */}
        <div className="border border-slate-200 rounded-lg overflow-hidden mb-12">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">Deskripsi Kebutuhan</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500 text-center">Qty</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500 text-right">Harga Satuan</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-700">{item.description}</p>
                    <p className="text-[10px] text-slate-400 font-mono">Kategori: {item.category}</p>
                  </td>
                  <td className="px-6 py-4 text-center font-bold">{item.quantity}</td>
                  <td className="px-6 py-4 text-right">Rp {Number(item.unit_price).toLocaleString("id-ID")}</td>
                  <td className="px-6 py-4 text-right font-black">Rp {Number(item.total_price).toLocaleString("id-ID")}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-900 text-white">
              <tr>
                <td colSpan={3} className="px-6 py-4 text-right font-bold uppercase tracking-widest text-[11px]">Total Dana Diajukan</td>
                <td className="px-6 py-4 text-right text-xl font-black">
                  Rp {Number(invoice.total_amount).toLocaleString("id-ID")}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Terbilang */}
        <div className="mb-12 p-4 bg-slate-50 border-l-4 border-slate-300 italic text-sm">
          "Dana tersebut akan digunakan untuk memenuhi kebutuhan operasional PPOB token listrik dan paket data modem monitoring periode {monthNames[periodDate.getMonth()]} {periodDate.getFullYear()}."
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-3 gap-8 mt-24 text-center">
          <div>
            <p className="mb-20 text-xs font-bold uppercase text-slate-400">Dibuat Oleh,</p>
            <div className="border-b border-slate-900 w-40 mx-auto"></div>
            <p className="mt-2 font-bold text-sm">Operational Admin</p>
          </div>
          <div></div>
          <div>
            <p className="mb-20 text-xs font-bold uppercase text-slate-400">Menyetujui,</p>
            <div className="border-b border-slate-900 w-40 mx-auto"></div>
            <p className="mt-2 font-bold text-sm">Finance Manager</p>
          </div>
        </div>

        <style jsx global>{`
          @media print {
            /* Hide dashboard elements and UI buttons */
            .no-print, nav, aside, .sidebar, button, .flex-col.w-64 { 
              display: none !important; 
            }
            
            /* Reset body and main containers */
            body, html { 
              background: white !important; 
              margin: 0 !important; 
              padding: 0 !important;
              width: 100% !important;
            }

            /* Target the layout wrapper to remove padding and background */
            .flex.bg-slate-50.min-h-screen {
              background: white !important;
              display: block !important;
            }

            .flex-1.overflow-auto, .p-8 {
              padding: 0 !important;
              margin: 0 !important;
              display: block !important;
              overflow: visible !important;
            }

            /* Format the invoice area */
            #print-area { 
              padding: 2cm !important; 
              margin: 0 !important; 
              width: 100% !important; 
              max-width: none !important;
              box-shadow: none !important;
            }

            /* Adjust table for printing */
            table {
              width: 100% !important;
              border-collapse: collapse !important;
            }

            /* Ensure serif font looks good on paper */
            #print-area {
              font-family: serif !important;
            }

            @page {
              size: auto;
              margin: 0mm;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
