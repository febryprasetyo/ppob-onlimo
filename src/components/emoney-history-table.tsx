"use client";

import { useState, useMemo } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Calendar, 
  Filter, 
  Wallet,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Clock
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { HistorySummaryCards } from "./history-summary-cards";

interface EmoneyHistoryTableProps {
  data: any[];
}

export function EmoneyHistoryTable({ data }: EmoneyHistoryTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [monthFilter, setMonthFilter] = useState("ALL");

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    data.forEach(item => {
      const date = new Date(item.created_at);
      const monthYear = date.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
      months.add(monthYear);
    });
    return Array.from(months);
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesSearch = 
        item.customer_no.includes(search) || 
        item.brand.toLowerCase().includes(search.toLowerCase()) ||
        item.product_name.toLowerCase().includes(search.toLowerCase()) ||
        item.ref_id.toLowerCase().includes(search.toLowerCase());
      
      const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
      
      const itemMonth = new Date(item.created_at).toLocaleString('id-ID', { month: 'long', year: 'numeric' });
      const matchesMonth = monthFilter === "ALL" || itemMonth === monthFilter;

      return matchesSearch && matchesStatus && matchesMonth;
    });
  }, [data, search, statusFilter, monthFilter]);

  const stats = useMemo(() => {
    return {
      total: filteredData.length,
      success: filteredData.filter(h => h.status === "SUCCESS").length,
      pending: filteredData.filter(h => h.status === "PENDING").length,
      failed: filteredData.filter(h => h.status === "FAILED").length,
    };
  }, [filteredData]);

  return (
    <div className="space-y-6">
      <div className="px-8 pt-8">
        <HistorySummaryCards stats={stats} />
      </div>
      <div className="p-8 bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row gap-6">
        <div className="flex-1 relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <Input 
            placeholder="Cari nomor HP, provider, atau Ref ID..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-14 h-14 rounded-2xl bg-white border-slate-100 shadow-sm focus:ring-4 focus:ring-blue-500/5 font-bold text-slate-600"
          />
        </div>

        <div className="w-full md:w-[240px]">
          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger className="h-14 rounded-2xl bg-white border-slate-100 shadow-sm px-6 font-bold text-slate-600 focus:ring-4 focus:ring-blue-500/5">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-slate-400" />
                <SelectValue placeholder="Pilih Bulan" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-slate-100 animate-in fade-in-0 zoom-in-95">
              <SelectItem value="ALL" className="font-bold py-3 uppercase text-[10px] tracking-widest">Semua Bulan</SelectItem>
              {availableMonths.map(month => (
                <SelectItem key={month} value={month} className="font-bold py-3 uppercase text-[10px] tracking-widest">{month}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full md:w-[200px]">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-14 rounded-2xl bg-white border-slate-100 shadow-sm px-6 font-bold text-slate-600 focus:ring-4 focus:ring-blue-500/5">
              <div className="flex items-center gap-3">
                <Filter className="h-4 w-4 text-slate-400" />
                <SelectValue placeholder="Status" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-slate-100 animate-in fade-in-0 zoom-in-95">
              <SelectItem value="ALL" className="font-bold py-3 uppercase text-[10px] tracking-widest">Semua Status</SelectItem>
              <SelectItem value="SUCCESS" className="font-bold py-3 uppercase text-[10px] tracking-widest text-emerald-600">Berhasil</SelectItem>
              <SelectItem value="PENDING" className="font-bold py-3 uppercase text-[10px] tracking-widest text-orange-600">Pending</SelectItem>
              <SelectItem value="FAILED" className="font-bold py-3 uppercase text-[10px] tracking-widest text-rose-600">Gagal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto no-scrollbar">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="border-slate-100 hover:bg-transparent">
              <TableHead className="font-black uppercase tracking-widest text-[10px] text-slate-400 py-6 pl-10">Waktu & Ref ID</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px] text-slate-400">Provider & Produk</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px] text-slate-400">Nomor Tujuan</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px] text-slate-400 text-center">Status</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px] text-slate-400 text-right pr-10">Harga</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((item) => (
                <TableRow key={item.ref_id} className="group hover:bg-slate-50/50 transition-all border-slate-50 last:border-0">
                  <TableCell className="py-6 pl-10">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-800 tracking-tight text-sm">{new Date(item.created_at).toLocaleString('id-ID', { 
                        day: '2-digit', 
                        month: 'short', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}</span>
                      <code className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{item.ref_id}</code>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600 group-hover:scale-110 transition-transform duration-500">
                        <Wallet className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-black text-slate-700 uppercase text-xs tracking-tight">{item.brand}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.product_name}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-3.5 w-3.5 text-slate-300" />
                      <span className="font-black text-slate-600 tabular-nums tracking-widest text-sm">{item.customer_no}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={cn(
                      "font-black uppercase text-[10px] tracking-widest px-4 py-1.5 rounded-full shadow-sm",
                      item.status === "SUCCESS" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                      item.status === "PENDING" ? "bg-orange-50 text-orange-600 border-orange-100 animate-pulse" :
                      "bg-rose-50 text-rose-600 border-rose-100"
                    )} variant="outline">
                      {item.status === "SUCCESS" ? <CheckCircle2 className="h-3 w-3 mr-2" /> : 
                       item.status === "PENDING" ? <Clock className="h-3 w-3 mr-2" /> : 
                       <AlertCircle className="h-3 w-3 mr-2" />}
                      {item.status === "SUCCESS" ? "Berhasil" : 
                       item.status === "PENDING" ? "Diproses" : "Gagal"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-10">
                    <span className="font-black text-slate-800 tabular-nums text-sm">
                      Rp {Number(item.price).toLocaleString("id-ID")}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="py-20 text-center">
                  <div className="flex flex-col items-center justify-center gap-4 text-slate-300">
                    <Clock className="h-16 w-16 opacity-10" />
                    <p className="text-lg font-bold text-slate-400 italic">Belum ada history transaksi e-money</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
