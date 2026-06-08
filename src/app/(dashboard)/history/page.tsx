import db from "@/lib/db";
import { HistoryTabs } from "@/components/history-tabs";
import { History } from "lucide-react";

export const dynamic = "force-dynamic";

interface HistoryPageProps {
  searchParams: Promise<{
    tab?: string;
  }>;
}

export default async function HistoryPage({ searchParams }: HistoryPageProps) {
  const { tab } = await searchParams;
  const currentTab = tab || "pln";

  const historyPln = await db("trx_pln")
    .join("assets_pln", "trx_pln.asset_id", "assets_pln.id")
    .select("trx_pln.*", "assets_pln.nama_stasiun", "assets_pln.meter_number")
    .orderBy("created_at", "desc");

  const historyOrbit = await db("trx_orbit")
    .join("assets_orbit", "trx_orbit.asset_id", "assets_orbit.id")
    .select("trx_orbit.*", "assets_orbit.nama_stasiun", "assets_orbit.phone_number")
    .orderBy("created_at", "desc");

  const historyEmoney = await db("trx_emoney")
    .select("*")
    .orderBy("created_at", "desc");

  return (
    <div className="space-y-8 animate-slide-in-bottom">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 flex items-center gap-4">
            <div className="p-3 premium-gradient rounded-2xl shadow-xl shadow-blue-500/20">
              <History className="h-8 w-8 text-white" />
            </div>
            <span className="text-gradient">Riwayat Transaksi</span>
          </h1>
          <p className="text-slate-500 mt-3 font-bold text-sm uppercase tracking-widest pl-1 border-l-4 border-blue-500 ml-1">
            Transaction Logs • Global Audit Monitor
          </p>
        </div>
      </div>

      <HistoryTabs 
        defaultTab={currentTab} 
        historyPln={historyPln} 
        historyOrbit={historyOrbit} 
        historyEmoney={historyEmoney}
      />
    </div>
  );
}
