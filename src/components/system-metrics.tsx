"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Server, 
  MessageSquare, 
  Activity, 
  Database, 
  CheckCircle2, 
  XCircle,
  TrendingUp,
  Clock,
  Radio
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SystemStatus {
  gateways: {
    name: string;
    status: "ONLINE" | "OFFLINE";
    provider: string;
    balance?: number;
    session?: string;
  }[];
  operations: {
    total_stations: number;
    pln_stations: number;
    orbit_stations: number;
  };
  performance: {
    last_24h_success_rate: number;
    pending_transactions: number;
    failed_transactions: number;
    total_transactions_24h: number;
  };
}

export function SystemMetrics() {
  const [data, setData] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/system/status");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Failed to fetch system status", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-[2rem]" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2 px-1">
        <Activity className="h-5 w-5 text-blue-500" />
        <h2 className="text-lg font-black text-slate-800 uppercase tracking-widest">System Matrix</h2>
        <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent ml-2" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Gateway: Digiflazz */}
        {data.gateways.map((gw, idx) => (
          <Card key={idx} className="border-none shadow-xl shadow-slate-200/50 bg-white rounded-[2rem] overflow-hidden group hover:scale-[1.02] transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className={cn(
                  "p-3 rounded-2xl",
                  gw.name.includes("PPOB") ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"
                )}>
                  {gw.name.includes("PPOB") ? <Server className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
                </div>
                <div className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-tighter",
                  gw.status === "ONLINE" 
                    ? "bg-emerald-100 text-emerald-700 animate-pulse-subtle" 
                    : "bg-rose-100 text-rose-700"
                )}>
                  <div className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    gw.status === "ONLINE" ? "bg-emerald-500" : "bg-rose-500"
                  )} />
                  {gw.status}
                </div>
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">{gw.name}</CardTitle>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-xl font-black text-slate-900">{gw.provider}</span>
                </div>
                {gw.balance !== undefined && (
                  <p className="text-[10px] font-bold text-blue-600 mt-1">Available Gateway Credits</p>
                )}
                {gw.session && (
                    <p className="text-[10px] font-bold text-emerald-600 mt-1">Session: {gw.session}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Operational Stats */}
        <Card className="border-none shadow-xl shadow-slate-200/50 bg-white rounded-[2rem] overflow-hidden group hover:scale-[1.02] transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                <Database className="h-6 w-6" />
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-tighter bg-indigo-100 text-indigo-700">
                ACTIVE NODES
              </div>
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Stations</CardTitle>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">{data.operations.total_stations}</span>
                <span className="text-xs font-bold text-slate-400">Deployed</span>
              </div>
              <div className="flex gap-3 mt-2">
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    {data.operations.pln_stations} PLN
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                    {data.operations.orbit_stations} ORBIT
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance */}
        <Card className="border-none shadow-xl shadow-slate-200/50 bg-white rounded-[2rem] overflow-hidden group hover:scale-[1.02] transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-tighter bg-amber-100 text-amber-700">
                24H HEALTH
              </div>
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Success Rate</CardTitle>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">{data.performance.last_24h_success_rate}%</span>
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-emerald-600 leading-none">OPTIMAL</span>
                    <span className="text-[9px] font-bold text-slate-400">PERFORMANCE</span>
                </div>
              </div>
              <div className="flex gap-3 mt-2">
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                    <Clock className="h-3 w-3 text-amber-500" />
                    {data.performance.pending_transactions} Pending
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                    <Radio className="h-3 w-3 text-rose-500" />
                    {data.performance.failed_transactions} Errors
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
