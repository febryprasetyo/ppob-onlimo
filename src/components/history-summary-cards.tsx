"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Clock, AlertCircle, FileText } from "lucide-react";

interface Stats {
  total: number;
  success: number;
  pending: number;
  failed: number;
}

export function HistorySummaryCards({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <Card className="rounded-3xl border-none shadow-xl shadow-slate-200/50 bg-white overflow-hidden group hover:scale-[1.02] transition-all duration-300">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="p-3 bg-slate-100 text-slate-600 rounded-2xl group-hover:bg-slate-900 group-hover:text-white transition-colors">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Transaksi</p>
            <p className="text-2xl font-black text-slate-900 tabular-nums">{stats.total}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-none shadow-xl shadow-slate-200/50 bg-white overflow-hidden group hover:scale-[1.02] transition-all duration-300">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Berhasil</p>
            <p className="text-2xl font-black text-emerald-600 tabular-nums">{stats.success}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-none shadow-xl shadow-slate-200/50 bg-white overflow-hidden group hover:scale-[1.02] transition-all duration-300">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl group-hover:bg-amber-500 group-hover:text-white transition-colors">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Pending</p>
            <p className="text-2xl font-black text-amber-600 tabular-nums">{stats.pending}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-none shadow-xl shadow-slate-200/50 bg-white overflow-hidden group hover:scale-[1.02] transition-all duration-300">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl group-hover:bg-rose-600 group-hover:text-white transition-colors">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Gagal</p>
            <p className="text-2xl font-black text-rose-600 tabular-nums">{stats.failed}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
