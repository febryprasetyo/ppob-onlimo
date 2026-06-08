"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Zap, Wifi, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HistoryTable } from "@/components/history-table";
import { PlnHistoryTable } from "@/components/pln-history-table";
import { EmoneyHistoryTable } from "@/components/emoney-history-table";

interface HistoryTabsProps {
  defaultTab: string;
  historyPln: any[];
  historyOrbit: any[];
  historyEmoney: any[];
}

export function HistoryTabs({ 
  defaultTab, 
  historyPln, 
  historyOrbit, 
  historyEmoney
}: HistoryTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const onTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <Tabs defaultValue={defaultTab} onValueChange={onTabChange} className="w-full space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/50 backdrop-blur-md p-2 rounded-[2rem] border border-white shadow-xl shadow-slate-200/50">
        <TabsList className="bg-slate-100/80 h-14 p-1.5 gap-2 rounded-[1.6rem] w-full sm:w-fit">
          <TabsTrigger 
            value="pln" 
            className="px-8 rounded-[1.2rem] h-full data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-lg transition-all duration-500 gap-3 font-black uppercase text-[10px] tracking-widest"
          >
            <Zap className="h-4 w-4" />
            Token Listrik
          </TabsTrigger>
          <TabsTrigger 
            value="orbit" 
            className="px-8 rounded-[1.2rem] h-full data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-lg transition-all duration-500 gap-3 font-black uppercase text-[10px] tracking-widest"
          >
            <Wifi className="h-4 w-4" />
            Internet Orbit
          </TabsTrigger>
          <TabsTrigger 
            value="emoney" 
            className="px-8 rounded-[1.2rem] h-full data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-lg transition-all duration-500 gap-3 font-black uppercase text-[10px] tracking-widest"
          >
            <Wallet className="h-4 w-4" />
            Top Up E-Money
          </TabsTrigger>
        </TabsList>
        
        <div className="hidden lg:flex items-center gap-2 px-6 py-2 bg-slate-100/50 text-slate-500 rounded-2xl border border-slate-200/50">
          <span className="text-[10px] font-black uppercase tracking-widest">Sinkronisasi Database Aktif</span>
        </div>
      </div>

      <TabsContent value="pln" className="mt-0 focus-visible:outline-none outline-none">
        <Card className="border-none shadow-2xl shadow-slate-200/60 overflow-hidden rounded-[2.5rem] bg-white group">
          <CardHeader className="bg-gradient-to-br from-blue-50 via-white to-transparent border-b border-slate-100 py-8 px-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="p-4 premium-gradient rounded-3xl shadow-2xl shadow-blue-500/30 group-hover:scale-110 transition-transform duration-500">
                  <Zap className="h-7 w-7 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black text-slate-800 tracking-tight">Log Token Listrik</CardTitle>
                  <p className="text-sm text-slate-400 font-bold uppercase tracking-wider mt-1">PLN Transaction History Ledger</p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <PlnHistoryTable data={historyPln} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="orbit" className="mt-0 focus-visible:outline-none outline-none">
        <Card className="border-none shadow-2xl shadow-slate-200/60 overflow-hidden rounded-[2.5rem] bg-white group">
          <CardHeader className="bg-gradient-to-br from-indigo-50 via-white to-transparent border-b border-slate-100 py-8 px-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-indigo-600 rounded-3xl shadow-2xl shadow-indigo-500/30 group-hover:scale-110 transition-transform duration-500">
                  <Wifi className="h-7 w-7 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black text-slate-800 tracking-tight">Log Internet Orbit</CardTitle>
                  <p className="text-sm text-slate-400 font-bold uppercase tracking-wider mt-1">Telkomsel Data Usage Ledger</p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <HistoryTable data={historyOrbit} type="ORBIT" />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="emoney" className="mt-0 focus-visible:outline-none outline-none">
        <Card className="border-none shadow-2xl shadow-slate-200/60 overflow-hidden rounded-[2.5rem] bg-white group">
          <CardHeader className="bg-gradient-to-br from-purple-50 via-white to-transparent border-b border-slate-100 py-8 px-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-purple-600 rounded-3xl shadow-2xl shadow-purple-500/30 group-hover:scale-110 transition-transform duration-500">
                  <Wallet className="h-7 w-7 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black text-slate-800 tracking-tight">Log Top Up E-Money</CardTitle>
                  <p className="text-sm text-slate-400 font-bold uppercase tracking-wider mt-1">Wallet & Digital Balance Ledger</p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <EmoneyHistoryTable data={historyEmoney} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
