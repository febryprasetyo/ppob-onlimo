"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CreditCard, 
  Plus, 
  TrendingUp, 
  History as HistoryIcon, 
  FileText, 
  Eye, 
  CheckCircle,
  Download,
  Zap,
  Wifi
} from "lucide-react";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { NewInvoiceDialog } from "@/components/finance/new-invoice-dialog";

export default function FinancePage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [report, setReport] = useState<any>(null);
  const [newInvOpen, setNewInvOpen] = useState(false);
  const [filter, setFilter] = useState({
    month: String(new Date().getMonth() + 1),
    year: String(new Date().getFullYear()),
  });

  const fetchInvoices = async () => {
    try {
      const res = await fetch("/api/finance/invoices");
      const json = await res.json();
      if (json.success) setInvoices(json.data);
    } catch (err) {
      console.error("Fetch invoices failed", err);
    }
  };

  const fetchReport = async () => {
    try {
      const res = await fetch(`/api/finance/report?month=${filter.month}&year=${filter.year}`);
      const json = await res.json();
      if (json.success) setReport(json.data);
    } catch (err) {
      console.error("Fetch report failed", err);
    }
  };

  const updateInvoiceStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(`/api/finance/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (json.success) fetchInvoices();
    } catch (err) {
      console.error("Update status failed", err);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    fetchReport();
  }, [filter]);

  return (
    <div className="space-y-8 animate-slide-in-bottom pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 flex items-center gap-4">
            <div className="p-3 premium-gradient rounded-2xl shadow-xl shadow-blue-500/20">
              <CreditCard className="h-8 w-8 text-white" />
            </div>
            <span className="text-gradient">Modul Keuangan</span>
          </h1>
          <p className="text-slate-500 mt-3 font-bold text-sm uppercase tracking-widest pl-1 border-l-4 border-blue-500 ml-1">
            Financial Operations • Budget & Deposit Unit
          </p>
        </div>
        <Button onClick={() => setNewInvOpen(true)} className="premium-gradient hover:opacity-95 text-white shadow-xl shadow-blue-500/20 transition-all active:scale-95 h-16 rounded-2xl px-10 font-black uppercase text-xs tracking-widest flex gap-3">
          <Plus className="h-5 w-5" /> Buat Pengajuan Deposit
        </Button>
      </div>

      <Tabs defaultValue="deposit" className="w-full space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/50 backdrop-blur-md p-2 rounded-[2rem] border border-white shadow-xl shadow-slate-200/50">
          <TabsList className="bg-slate-100/80 h-14 p-1.5 gap-2 rounded-[1.6rem] w-full sm:w-fit">
            <TabsTrigger 
              value="deposit" 
              className="px-8 rounded-[1.2rem] h-full data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-lg transition-all duration-500 gap-3 font-black uppercase text-[10px] tracking-widest"
            >
              <CreditCard className="h-4 w-4" />
              Pengajuan Deposit
            </TabsTrigger>
            <TabsTrigger 
              value="realization" 
              className="px-8 rounded-[1.2rem] h-full data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-lg transition-all duration-500 gap-3 font-black uppercase text-[10px] tracking-widest"
            >
              <TrendingUp className="h-4 w-4" />
              Laporan Realisasi
            </TabsTrigger>
          </TabsList>
          
          <div className="hidden lg:flex items-center gap-2 px-6 py-2 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100/50">
            <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest">Sistem Keuangan Mandiri</span>
          </div>
        </div>

        <TabsContent value="deposit" className="mt-0 focus-visible:outline-none outline-none">
          <Card className="border-none shadow-2xl shadow-slate-200/60 overflow-hidden rounded-[2.5rem] bg-white group">
            <CardHeader className="bg-gradient-to-br from-slate-50 via-white to-transparent border-b border-slate-100 py-8 px-8">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-slate-900 rounded-3xl shadow-2xl shadow-slate-500/30 group-hover:scale-110 transition-transform duration-500">
                  <HistoryIcon className="h-7 w-7 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black text-slate-800 tracking-tight">Riwayat Pengajuan Dana</CardTitle>
                  <p className="text-sm text-slate-400 font-bold uppercase tracking-wider mt-1">Financial Audit • Deposit Ledger</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto no-scrollbar">
                <Table>
                  <TableHeader className="bg-slate-50/80">
                    <TableRow>
                      <TableHead className="py-6 pl-8 font-black uppercase tracking-widest text-[10px] text-slate-400">No. Invoice</TableHead>
                      <TableHead className="font-black uppercase tracking-widest text-[10px] text-slate-400">Periode</TableHead>
                      <TableHead className="font-black uppercase tracking-widest text-[10px] text-slate-400">Nominal</TableHead>
                      <TableHead className="font-black uppercase tracking-widest text-[10px] text-slate-400">Status</TableHead>
                      <TableHead className="font-black uppercase tracking-widest text-[10px] text-slate-400">Tanggal Dibuat</TableHead>
                      <TableHead className="text-right pr-8 font-black uppercase tracking-widest text-[10px] text-slate-400">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-24">
                          <div className="flex flex-col items-center gap-3 text-slate-300">
                            <FileText className="h-12 w-12 opacity-20" />
                            <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Belum ada pengajuan dana</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      invoices.map((inv) => (
                        <TableRow key={inv.id} className="group hover:bg-slate-50 transition-all border-slate-50">
                          <TableCell className="pl-8 font-black text-slate-900 font-mono text-[11px] group-hover:text-blue-600 transition-colors uppercase tracking-widest">{inv.invoice_no}</TableCell>
                          <TableCell className="font-bold text-slate-600">
                            {new Date(inv.period).toLocaleString('id-ID', { month: 'long', year: 'numeric' })}
                          </TableCell>
                          <TableCell>
                            <span className="font-black text-slate-900 text-lg tabular-nums">
                              Rp {Number(inv.total_amount).toLocaleString("id-ID")}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className={cn(
                              "inline-flex items-center px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] border transition-all shadow-sm",
                              inv.status === "PAID" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                              inv.status === "CANCELLED" ? "bg-rose-50 text-rose-600 border-rose-100" :
                              "bg-amber-50 text-amber-600 border-amber-100"
                            )}>
                              {inv.status}
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                            {new Date(inv.created_at).toLocaleDateString("id-ID")}
                          </TableCell>
                          <TableCell className="text-right pr-8">
                            <div className="flex justify-end gap-3">
                              <Link href={`/finance/invoice/${inv.id}`}>
                                <Button variant="outline" className="h-12 w-12 rounded-2xl p-0 hover:bg-blue-50 border-slate-100 transition-all">
                                  <Eye className="h-5 w-5 text-slate-400 group-hover:text-blue-600" />
                                </Button>
                              </Link>
                              {inv.status === "UNPAID" && (
                                <Button className="h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] tracking-widest px-6 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex gap-3" onClick={() => updateInvoiceStatus(inv.id, "PAID")}>
                                  <CheckCircle className="h-4 w-4" /> Bayar
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="realization" className="mt-0 focus-visible:outline-none outline-none">
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row gap-6 p-8 bg-white rounded-[2.5rem] border border-white shadow-2xl shadow-slate-200/50 items-end">
              <div className="space-y-3 flex-1">
                <Label className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 pl-1">Periode Laporan</Label>
                <div className="flex gap-4">
                  <select className="h-14 px-6 rounded-2xl border border-slate-100 bg-slate-50/50 flex-1 font-bold text-slate-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all text-sm" value={filter.month} onChange={(e) => setFilter({...filter, month: e.target.value})}>
                    {[...Array(12)].map((_, i) => (
                      <option key={i+1} value={String(i+1)}>{new Date(2024, i).toLocaleString('id-ID', {month: 'long'})}</option>
                    ))}
                  </select>
                  <input type="number" className="h-14 px-6 rounded-2xl border border-slate-100 bg-slate-50/50 w-32 font-bold text-slate-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all text-sm" value={filter.year} onChange={(e) => setFilter({...filter, year: e.target.value})} />
                </div>
              </div>
              <Button variant="outline" className="h-14 px-8 rounded-2xl border-slate-100 font-black uppercase text-[10px] tracking-widest text-slate-500 hover:bg-slate-50 flex gap-3">
                <Download className="h-4 w-4" /> Export Report (CSV)
              </Button>
            </div>

            {report && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="border-none shadow-2xl shadow-blue-500/10 overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-blue-700 group hover:scale-[1.02] transition-transform duration-500">
                  <CardContent className="p-8 relative">
                    <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-110 transition-transform duration-700">
                      <Zap className="h-20 w-20 text-white" />
                    </div>
                    <p className="text-blue-100/60 font-black uppercase tracking-[0.2em] text-[10px] mb-4">Total Realisasi PLN</p>
                    <h3 className="text-4xl font-black text-white tabular-nums tracking-tighter">Rp {report.summary.pln.toLocaleString("id-ID")}</h3>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-2xl shadow-indigo-500/10 overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-indigo-700 group hover:scale-[1.02] transition-transform duration-500">
                  <CardContent className="p-8 relative">
                    <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-110 transition-transform duration-700">
                      <Wifi className="h-20 w-20 text-white" />
                    </div>
                    <p className="text-indigo-100/60 font-black uppercase tracking-[0.2em] text-[10px] mb-4">Total Realisasi Orbit</p>
                    <h3 className="text-4xl font-black text-white tabular-nums tracking-tighter">Rp {report.summary.orbit.toLocaleString("id-ID")}</h3>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-2xl shadow-slate-900/10 overflow-hidden rounded-[2.5rem] bg-slate-900 group hover:scale-[1.02] transition-transform duration-500">
                  <CardContent className="p-8 relative">
                    <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-110 transition-transform duration-700">
                      <CreditCard className="h-20 w-20 text-white" />
                    </div>
                    <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px] mb-4">Grand Total Realisasi</p>
                    <h3 className="text-4xl font-black text-emerald-400 tabular-nums tracking-tighter">Rp {report.summary.total.toLocaleString("id-ID")}</h3>
                  </CardContent>
                </Card>
              </div>
            )}

            <Card className="border-none shadow-2xl shadow-slate-200/60 overflow-hidden rounded-[2.5rem] bg-white group">
              <CardHeader className="bg-gradient-to-br from-slate-50 via-white to-transparent border-b border-slate-100 py-8 px-8">
                <div className="flex items-center gap-5">
                  <div className="p-4 bg-emerald-500 rounded-3xl shadow-2xl shadow-emerald-500/30 group-hover:scale-110 transition-transform duration-500">
                    <FileText className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-black text-slate-800 tracking-tight">Detail Transaksi Realisasi</CardTitle>
                    <p className="text-sm text-slate-400 font-bold uppercase tracking-wider mt-1">Audit Ledger • Operational Successful Loop</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto no-scrollbar">
                  <Table>
                    <TableHeader className="bg-slate-50/80">
                      <TableRow>
                        <TableHead className="py-6 pl-8 font-black uppercase tracking-widest text-[10px] text-slate-400">Waktu</TableHead>
                        <TableHead className="font-black uppercase tracking-widest text-[10px] text-slate-400">Kategori</TableHead>
                        <TableHead className="font-black uppercase tracking-widest text-[10px] text-slate-400">Nama Aset</TableHead>
                        <TableHead className="font-black uppercase tracking-widest text-[10px] text-slate-400">SN / Ref Info</TableHead>
                        <TableHead className="text-right pr-8 font-black uppercase tracking-widest text-[10px] text-slate-400">Biaya (HPP)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!report || report.details.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-24">
                            <div className="flex flex-col items-center gap-3 text-slate-300">
                              <HistoryIcon className="h-12 w-12 opacity-20" />
                              <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Tidak ada transaksi di periode ini</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        report.details.map((trx: any, i: number) => (
                          <TableRow key={i} className="group hover:bg-slate-50 transition-all border-slate-50">
                            <TableCell className="pl-8 text-[11px] font-bold text-slate-400 uppercase">
                              {new Date(trx.created_at).toLocaleString("id-ID")}
                            </TableCell>
                            <TableCell>
                              <div className={cn(
                                "inline-flex items-center px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border",
                                trx.category === 'PLN' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                              )}>
                                {trx.category}
                              </div>
                            </TableCell>
                            <TableCell className="font-black text-slate-800 tracking-tight uppercase">{trx.asset_name}</TableCell>
                            <TableCell className="font-mono text-[10px] text-slate-400 group-hover:text-slate-600 transition-colors uppercase tracking-widest">
                              <span className="truncate max-w-[200px] block font-bold">{trx.detail}</span>
                            </TableCell>
                            <TableCell className="text-right pr-8">
                              <span className="font-black text-emerald-600 tabular-nums text-lg">
                                Rp {Number(trx.price).toLocaleString("id-ID")}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <NewInvoiceDialog 
        open={newInvOpen} 
        onOpenChange={setNewInvOpen} 
        onSuccess={(inv) => {
          fetchInvoices();
          // Optional: redirect to invoice detail
          // window.location.href = `/finance/invoice/${inv.id}`;
        }} 
      />
    </div>
  );
}
