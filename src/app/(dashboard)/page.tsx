import db from "@/lib/db";
import { AssetTable } from "@/components/asset-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardStats } from "@/components/dashboard-stats";
import { TestPlnModal } from "@/components/test-pln-modal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, Wifi, LayoutDashboard } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const processAssets = (assets: any[]) => {
    return assets.map(asset => {
      const lastTrxAt = asset.last_trx_at ? new Date(asset.last_trx_at) : null;
      const isDifferentMonth = lastTrxAt && (lastTrxAt.getMonth() !== currentMonth || lastTrxAt.getFullYear() !== currentYear);
      
      return {
        ...asset,
        last_trx_status: isDifferentMonth ? null : asset.last_trx_status
      };
    });
  };

  const assetsPlnRaw = await db("assets_pln").select("*").orderBy("id", "asc");
  const assetsOrbitRaw = await db("assets_orbit").select("*").orderBy("id", "asc");

  const assetsPln = processAssets(assetsPlnRaw);
  const assetsOrbit = processAssets(assetsOrbitRaw);

  return (
    <div className="space-y-8 animate-slide-in-bottom">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 flex items-center gap-4">
            <div className="p-3 premium-gradient rounded-2xl shadow-xl shadow-blue-500/20">
              <LayoutDashboard className="h-8 w-8 text-white" />
            </div>
            <span className="text-gradient">Dashboard Operasional</span>
          </h1>
          <p className="text-slate-500 mt-3 font-bold text-sm uppercase tracking-widest pl-1 border-l-4 border-blue-500 ml-1">
            Monitoring & Automated Transactions Unit
          </p>
        </div>
      </div>

      <div className="grid gap-8">
        <DashboardStats />
      </div>

      <Tabs defaultValue="pln" className="w-full space-y-8">
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
          </TabsList>
          
          <div className="hidden lg:flex items-center gap-2 px-6 py-2 bg-blue-50 text-blue-700 rounded-2xl border border-blue-100/50">
            <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest">Sistem Aktif & Terhubung</span>
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
                    <CardTitle className="text-2xl font-black text-slate-800 tracking-tight">Aset Token Listrik</CardTitle>
                    <p className="text-sm text-slate-400 font-bold uppercase tracking-wider mt-1">Global Monitoring System (GMS)</p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <AssetTable assets={assetsPln} type="PLN" />
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
                    <CardTitle className="text-2xl font-black text-slate-800 tracking-tight">Aset Internet Orbit</CardTitle>
                    <p className="text-sm text-slate-400 font-bold uppercase tracking-wider mt-1">Telkomsel Connectivity Manager</p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <AssetTable assets={assetsOrbit} type="ORBIT" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* <div className="fixed bottom-10 right-10 z-30 no-print">
        <TestPlnModal />
      </div> */}
    </div>
  );
}
