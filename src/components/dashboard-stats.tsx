"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, FileText, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Stats {
  digiflazz_balance: number;
  unbilled_total: number;
  monthly_spending: number;
  month_name: string;
}

export function DashboardStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[150px] mb-1" />
              <Skeleton className="h-3 w-[120px]" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-none shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-blue-100">Sisa Saldo Digiflazz</CardTitle>
          <Wallet className="h-4 w-4 text-blue-200" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Rp {stats.digiflazz_balance.toLocaleString("id-ID")}</div>
          <p className="text-xs text-blue-200 mt-1">Saldo Deposit Terkini</p>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-500">Belum Ditagihkan (LHK)</CardTitle>
          <FileText className="h-4 w-4 text-slate-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">Rp {stats.unbilled_total.toLocaleString("id-ID")}</div>
          <p className="text-xs text-slate-500 mt-1">Total pending tagihan kas</p>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-500">Total Transaksi {stats.month_name}</CardTitle>
          <BarChart3 className="h-4 w-4 text-slate-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">Rp {stats.monthly_spending.toLocaleString("id-ID")}</div>
          <p className="text-xs text-slate-500 mt-1">Akumulasi pengeluaran bulan ini</p>
        </CardContent>
      </Card>
    </div>
  );
}
