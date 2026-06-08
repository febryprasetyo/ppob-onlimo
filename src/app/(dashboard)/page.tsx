import db from "@/lib/db";
import { DashboardStats } from "@/components/dashboard-stats";
import { DashboardTabs } from "@/components/dashboard-tabs";
import { SystemMetrics } from "@/components/system-metrics";
import { LayoutDashboard } from "lucide-react";

export const dynamic = "force-dynamic";

interface DashboardPageProps {
  searchParams: Promise<{
    tab?: string;
  }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { tab } = await searchParams;
  const currentTab = tab || "pln";
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

  const assetsPlnRaw = await db("assets_pln").select("*").orderBy("nama_stasiun", "asc");
  const assetsOrbitRaw = await db("assets_orbit").select("*").orderBy("nama_stasiun", "asc");

  const assetsPln = processAssets(assetsPlnRaw);
  const assetsOrbit = processAssets(assetsOrbitRaw);

  return (
    <div className="space-y-8 animate-slide-in-bottom pb-10">
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

      <SystemMetrics />

      <DashboardTabs 
        defaultTab={currentTab} 
        assetsPln={assetsPln} 
        assetsOrbit={assetsOrbit} 
      />
      
      {/* <div className="fixed bottom-10 right-10 z-30 no-print">
        <TestPlnModal />
      </div> */}
    </div>
  );
}
