"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Eye, Send, RefreshCw, CheckCheck, Search, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReceiptModal } from "./receipt-modal";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TrxData {
  ref_id: string;
  nama_stasiun: string;
  meter_number?: string;
  phone_number?: string;
  sku: string;
  price: number;
  status: string;
  token_sn?: string;
  sn_ref?: string;
  wa_sent_at?: string | null;
  created_at: string;
  message?: string;
  raw_response?: any;
}

interface HistoryTableProps {
  data: TrxData[];
  type: "PLN" | "ORBIT";
}

export function HistoryTable({ data, type }: HistoryTableProps) {
  const [selectedTrx, setSelectedTrx] = useState<TrxData | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [waFilter, setWaFilter] = useState("all");

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleResendWA = async (ref_id: string) => {
    setLoadingId(ref_id);
    try {
      const res = await fetch("/api/trx/resend-wa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ref_id }),
      });
      const result = await res.json();
      if (result.success) {
        window.location.reload(); 
      } else {
        alert(result.error || "Gagal mengirim WA");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingId(null);
    }
  };

  const filteredData = data.filter((trx) => {
    const matchesSearch = trx.nama_stasiun.toLowerCase().includes(search.toLowerCase()) || 
                          (trx.phone_number && trx.phone_number.includes(search)) ||
                          (trx.meter_number && trx.meter_number.includes(search));
    
    let matchesFilter = true;
    if (waFilter === "sent") {
      matchesFilter = !!trx.wa_sent_at;
    } else if (waFilter === "not_sent") {
      matchesFilter = !trx.wa_sent_at && trx.status === "SUCCESS";
    } else if (waFilter === "failed") {
      matchesFilter = trx.status === "FAILED";
    }

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Search and Filter UI */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="relative flex-1 group">
          <Input
            placeholder={type === "PLN" ? "Cari nama stasiun atau ID Pelanggan..." : "Cari nama stasiun atau Nomor Orbit..."}
            className="pl-14 h-14 bg-white/50 backdrop-blur-md border-slate-100 shadow-sm focus-visible:ring-4 focus-visible:ring-blue-500/5 text-base rounded-2xl transition-all font-bold"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
        </div>
        <div className="w-full md:w-[240px]">
          <Select value={waFilter} onValueChange={setWaFilter}>
            <SelectTrigger className="h-14 rounded-2xl bg-white/50 backdrop-blur-md border-slate-100 shadow-sm px-6 font-bold text-slate-600 focus:ring-4 focus:ring-blue-500/5">
              <div className="flex items-center gap-3">
                <Filter className="h-4 w-4 text-slate-400" />
                <SelectValue placeholder="Status WA" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
              <SelectItem value="all" className="rounded-xl font-bold text-slate-600 focus:bg-blue-50 focus:text-blue-600 py-3">Semua Status</SelectItem>
              <SelectItem value="sent" className="rounded-xl font-bold text-slate-600 focus:bg-blue-50 focus:text-blue-600 py-3">Terkirim</SelectItem>
              <SelectItem value="not_sent" className="rounded-xl font-bold text-slate-600 focus:bg-blue-50 focus:text-blue-600 py-3">Belum Terkirim</SelectItem>
              <SelectItem value="failed" className="rounded-xl font-bold text-slate-600 focus:bg-blue-50 focus:text-blue-600 py-3">Gagal (Trx)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-[2rem] border-none shadow-2xl shadow-slate-200/50 bg-white overflow-hidden group">
        <div className="overflow-x-auto no-scrollbar">
          <Table>
            <TableHeader className="bg-slate-50/80 border-b border-slate-100">
              <TableRow>
                <TableHead className="py-6 pl-10 font-black uppercase tracking-widest text-[10px] text-slate-400">Ref ID</TableHead>
                <TableHead className="font-black uppercase tracking-widest text-[10px] text-slate-400">Lokasi / Provider</TableHead>
                <TableHead className="font-black uppercase tracking-widest text-[10px] text-slate-400">{type === "PLN" ? "ID Pelanggan" : "Nomor Identity"}</TableHead>
                {type === "PLN" && <TableHead className="font-black uppercase tracking-widest text-[10px] text-slate-400">Token PLN</TableHead>}
                <TableHead className="font-black uppercase tracking-widest text-[10px] text-slate-400">Harga</TableHead>
                <TableHead className="font-black uppercase tracking-widest text-[10px] text-slate-400 text-center">Status</TableHead>
                <TableHead className="font-black uppercase tracking-widest text-[10px] text-slate-400 text-center">WA Status</TableHead>
                <TableHead className="text-right pr-10 font-black uppercase tracking-widest text-[10px] text-slate-400">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={type === "PLN" ? 8 : 7} className="text-center py-20">
                    <div className="flex flex-col items-center justify-center gap-4 text-slate-300">
                      <div className="p-6 rounded-3xl bg-slate-50">
                        <Search className="h-12 w-12 opacity-20" />
                      </div>
                      <p className="text-sm font-black uppercase tracking-[0.2em]">Data Tidak Ditemukan</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((trx) => (
                  <TableRow key={trx.ref_id} className="group hover:bg-slate-50/50 transition-all border-slate-50">
                    <TableCell className="py-6 pl-10">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-mono font-black text-slate-400 tracking-tighter uppercase">{trx.ref_id}</span>
                        <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-0.5">
                          {new Date(trx.created_at).toLocaleString("id-ID", { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-base font-black text-slate-800 uppercase tracking-tight group-hover:text-blue-600 transition-colors leading-tight">{trx.nama_stasiun}</span>
                        <span className="text-[10px] text-slate-400 font-black tracking-widest uppercase mt-1 opacity-60">{trx.sku}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="bg-slate-100 px-3 py-1.5 rounded-xl text-[11px] font-black text-slate-500 tracking-widest group-hover:bg-slate-900 group-hover:text-white transition-all">
                        {type === "PLN" ? trx.meter_number : trx.phone_number}
                      </code>
                    </TableCell>
                    {type === "PLN" && (
                      <TableCell>
                        {trx.status === "SUCCESS" && trx.token_sn ? (
                          <div className="flex items-center gap-2">
                            <div className="premium-gradient text-white px-3 py-1.5 rounded-xl font-black text-sm tracking-[0.15em] shadow-lg shadow-blue-500/20">
                              {trx.token_sn}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-300 hover:text-blue-600"
                              onClick={() => copyToClipboard(trx.token_sn!)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest italic">-</span>
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      <span className="text-base font-black text-emerald-600 tabular-nums">Rp {Number(trx.price).toLocaleString("id-ID")}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        className={cn(
                          "font-black uppercase tracking-widest text-[9px] px-3 py-1 rounded-xl border-none shadow-sm",
                          trx.status === "SUCCESS" ? "bg-emerald-50 text-emerald-600 shadow-emerald-500/10" :
                          trx.status === "FAILED" ? "bg-rose-50 text-rose-600 shadow-rose-500/10" :
                          "bg-amber-50 text-amber-600 shadow-amber-500/10"
                        )}
                      >
                        {trx.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {trx.status !== "SUCCESS" ? (
                        <span className="text-slate-200">-</span>
                      ) : trx.wa_sent_at ? (
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100 shadow-sm" title={`Terkirim ${new Date(trx.wa_sent_at).toLocaleString()}`}>
                            <CheckCheck className="h-3.5 w-3.5" />
                            <span className="text-[9px] font-black uppercase tracking-widest">Sent</span>
                          </div>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-slate-100 text-slate-300 bg-slate-50/50">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right pr-10">
                      <div className="flex justify-end gap-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-11 w-11 rounded-2xl border-slate-100 shadow-sm text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all"
                          onClick={() => setSelectedTrx(trx)}
                        >
                          <Eye className="h-5 w-5" />
                        </Button>
                        {trx.status === "SUCCESS" && (
                          <Button
                            size="sm"
                            disabled={loadingId === trx.ref_id}
                            variant={trx.wa_sent_at ? "outline" : "default"}
                            className={cn(
                              "h-11 px-5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all",
                              !trx.wa_sent_at 
                                ? "premium-gradient text-white shadow-lg shadow-blue-500/20 border-none active:scale-95" 
                                : "bg-white text-slate-600 border-slate-100 hover:bg-slate-50"
                            )}
                            onClick={() => handleResendWA(trx.ref_id)}
                          >
                            {loadingId === trx.ref_id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : trx.wa_sent_at ? (
                              <RefreshCw className="h-4 w-4 mr-2" />
                            ) : (
                              <Send className="h-4 w-4 mr-2" />
                            )}
                            {trx.wa_sent_at ? "Resend" : "Send WA"}
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
      </div>

      {selectedTrx && (
        <ReceiptModal
          open={!!selectedTrx}
          onOpenChange={(open) => !open && setSelectedTrx(null)}
          type={type}
          status={selectedTrx.status === "SUCCESS" ? "success" : selectedTrx.status === "FAILED" ? "failed" : "pending"}
          title={selectedTrx.status === "SUCCESS" ? "Transaksi Berhasil" : selectedTrx.status === "FAILED" ? "Transaksi Gagal" : "Transaksi Diproses"}
          message={selectedTrx.message || (selectedTrx.status === "SUCCESS" ? "Transaksi berhasil." : "Sedang diproses.")}
          sn={type === "PLN" ? selectedTrx.token_sn : selectedTrx.sn_ref}
          ref_id={selectedTrx.ref_id}
          price={selectedTrx.price}
          raw_response={selectedTrx.raw_response}
          station_name={selectedTrx.nama_stasiun}
          customer_no={type === "PLN" ? selectedTrx.meter_number : selectedTrx.phone_number}
          created_at={selectedTrx.created_at}
        />
      )}
    </div>
  );
}
