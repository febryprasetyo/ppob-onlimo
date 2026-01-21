"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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
import { Copy, Send, RefreshCw, CheckCheck, Eye, Search, Filter } from "lucide-react";
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
  sku: string;
  price: number;
  status: string;
  token_sn?: string;
  wa_sent_at?: string | null;
  created_at: string;
  message?: string;
  raw_response?: any;
}

interface PlnHistoryTableProps {
  data: TrxData[];
}

export function PlnHistoryTable({ data }: PlnHistoryTableProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [selectedTrx, setSelectedTrx] = useState<TrxData | null>(null);
  const [search, setSearch] = useState("");
  const [waFilter, setWaFilter] = useState("all");
  const router = useRouter();
  const checkedRef = useRef<Set<string>>(new Set());

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
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingId(null);
    }
  };

  useEffect(() => {
    const pendingTrx = data.filter(t => t.status === "PENDING" && !checkedRef.current.has(t.ref_id));
    
    if (pendingTrx.length > 0) {
        const checkStatus = async () => {
            let hasGlobalChanges = false;
            
            for (const trx of pendingTrx) {
                checkedRef.current.add(trx.ref_id);
                try {
                    console.log("Auto-checking status for:", trx.ref_id);
                    const res = await fetch(`/api/trx/check-status?type=PLN&ref_id=${trx.ref_id}`);
                    const json = await res.json();
                    
                    if (json.success && json.status !== "PENDING") {
                        hasGlobalChanges = true;
                    }
                } catch (e) {
                    console.error("Auto check failed", e);
                }
            }

            if (hasGlobalChanges) {
                router.refresh();
            }
        };

        checkStatus();
    }
  }, [data, router]);

  const filteredData = data.filter((trx) => {
    const matchesSearch = trx.nama_stasiun.toLowerCase().includes(search.toLowerCase()) || 
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
            placeholder="Cari nama stasiun atau ID Pelanggan..."
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
                <TableHead className="py-6 pl-10 font-black uppercase tracking-widest text-[10px] text-slate-400">Waktu & Tanggal</TableHead>
                <TableHead className="font-black uppercase tracking-widest text-[10px] text-slate-400">Lokasi / Item</TableHead>
                <TableHead className="font-black uppercase tracking-widest text-[10px] text-slate-400">Token Listrik (SN)</TableHead>
                <TableHead className="font-black uppercase tracking-widest text-[10px] text-slate-400 text-center">Status</TableHead>
                <TableHead className="font-black uppercase tracking-widest text-[10px] text-slate-400 text-center">Status WA</TableHead>
                <TableHead className="text-right pr-10 font-black uppercase tracking-widest text-[10px] text-slate-400">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20">
                    <div className="flex flex-col items-center justify-center gap-4 text-slate-300">
                      <div className="p-6 rounded-3xl bg-slate-50">
                        <Search className="h-12 w-12 opacity-20" />
                      </div>
                      <p className="text-sm font-black uppercase tracking-[0.2em]">Data Tidak Ditemukan</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((trx) => {
                  const isSuccess = trx.status === "SUCCESS";
                  const isWaSent = !!trx.wa_sent_at;
                  
                  // Parse Token SN
                  let tokenCode = trx.token_sn || "-";
                  let tokenDetails = "";
                  
                  if (trx.token_sn && trx.token_sn.includes("/")) {
                    const parts = trx.token_sn.split("/");
                    tokenCode = parts[0];
                    tokenDetails = parts.slice(1).join(" / ");
                  }

                  return (
                    <TableRow key={trx.ref_id} className="group hover:bg-slate-50/50 transition-all border-slate-50 relative overflow-hidden">
                      <TableCell className="py-8 pl-10 align-top">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-black text-slate-900 tabular-nums tracking-tight">
                            {new Date(trx.created_at).toLocaleString("id-ID", {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 rounded-md w-fit px-2 py-0.5">
                            {new Date(trx.created_at).toLocaleString("id-ID", {
                              hour: '2-digit',
                              minute: '2-digit'
                            })} WIB
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="flex flex-col gap-1">
                          <span className="text-base font-black text-slate-800 uppercase tracking-tight group-hover:text-blue-600 transition-colors">{trx.nama_stasiun}</span>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-100">ID: {trx.meter_number}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="align-top max-w-[300px]">
                        {isSuccess && trx.token_sn ? (
                          <div className="flex flex-col items-start gap-2">
                            <div className="flex items-center gap-2 w-full">
                                <div className="premium-gradient text-white px-3 py-2.5 rounded-xl font-black text-lg tracking-[0.15em] shadow-lg shadow-blue-500/20 tabular-nums truncate max-w-full hover:scale-[1.02] transition-transform cursor-pointer relative group/token"
                                    onClick={() => copyToClipboard(tokenCode.trim())}
                                >
                                    {tokenCode.trim()}
                                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover/token:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                                        <Copy className="h-5 w-5 drop-shadow-md" />
                                    </div>
                                </div>
                            </div>
                            {tokenDetails && (
                                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100 w-full break-words">
                                    {tokenDetails}
                                </div>
                            )}
                          </div>
                        ) : (
                            <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100 w-fit">
                                <span className={cn(
                                    "h-2 w-2 rounded-full animate-pulse",
                                    trx.status === "FAILED" ? "bg-rose-500" : "bg-amber-500"
                                )} />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    {trx.status === "FAILED" ? "Gagal / Dibatalkan" : "Sedang Diproses..."}
                                </span>
                            </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center align-top pt-8">
                        <Badge
                          className={cn(
                            "font-black uppercase tracking-widest text-[9px] px-3 py-1 rounded-lg border-none transition-all",
                            isSuccess ? "bg-emerald-100 text-emerald-700 shadow-sm shadow-emerald-500/10" :
                            trx.status === "FAILED" ? "bg-rose-100 text-rose-700 shadow-sm shadow-rose-500/10" :
                            "bg-amber-100 text-amber-700 shadow-sm shadow-amber-500/10"
                          )}
                        >
                          {trx.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center align-top pt-8">
                        {!isSuccess ? (
                          <span className="text-slate-200 text-2xl font-black">·</span>
                        ) : isWaSent ? (
                          <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                              <CheckCheck className="h-3 w-3" />
                              <span className="text-[9px] font-black uppercase tracking-widest">OK</span>
                            </div>
                            <span className="text-[9px] font-bold text-slate-400 tabular-nums">
                                {new Date(trx.wa_sent_at!).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ) : (
                          <div className="h-2 w-2 mx-auto rounded-full bg-slate-200" title="Belum dikirim" />
                        )}
                      </TableCell>
                      <TableCell className="text-right pr-10 align-top">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-10 w-10 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100"
                            onClick={() => setSelectedTrx(trx)}
                          >
                            <Eye className="h-5 w-5" />
                          </Button>
                          {isSuccess && (
                            <Button
                              size="sm"
                              disabled={loadingId === trx.ref_id}
                              className={cn(
                                "h-10 px-4 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all shadow-sm",
                                !isWaSent 
                                  ? "premium-gradient text-white shadow-blue-500/20 active:scale-95" 
                                  : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:text-slate-700 hover:border-slate-300"
                              )}
                              onClick={() => handleResendWA(trx.ref_id)}
                            >
                              {loadingId === trx.ref_id ? (
                                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                              ) : isWaSent ? (
                                <div className="flex items-center gap-2">
                                    <RefreshCw className="h-3.5 w-3.5" />
                                    <span>Kirim Ulang</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                    <Send className="h-3.5 w-3.5" />
                                    <span>Kirim WA</span>
                                </div>
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {selectedTrx && (
        <ReceiptModal
          open={!!selectedTrx}
          onOpenChange={(open) => !open && setSelectedTrx(null)}
          type="PLN"
          status={selectedTrx.status === "SUCCESS" ? "success" : selectedTrx.status === "FAILED" ? "failed" : "pending"}
          title={selectedTrx.status === "SUCCESS" ? "Transaksi Berhasil" : selectedTrx.status === "FAILED" ? "Transaksi Gagal" : "Transaksi Diproses"}
          message={selectedTrx.message || (selectedTrx.status === "SUCCESS" ? "Token berhasil diterbitkan." : "Sedang diproses.")}
          sn={selectedTrx.token_sn}
          ref_id={selectedTrx.ref_id}
          price={selectedTrx.price}
          raw_response={selectedTrx.raw_response}
          station_name={selectedTrx.nama_stasiun}
          customer_no={selectedTrx.meter_number}
          created_at={selectedTrx.created_at}
        />
      )}
    </div>
  );
}
