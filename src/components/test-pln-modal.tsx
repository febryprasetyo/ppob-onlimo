"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Zap, 
  CheckCircle2, 
  XCircle, 
  Copy, 
  Info, 
  Bug, 
  ChevronDown, 
  ChevronUp,
  Ticket,
  FlaskConical
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function TestPlnModal() {
  const [open, setOpen] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  // Data Statis untuk Simulasi
  const staticData = {
    success: true,
    title: "Transaksi Berhasil",
    station_name: "Pos Pantau Onlimo",
    customer_no: "123456789012",
    sn: "5627-8829-1022-7718-9201",
    ref_id: "PLN-SIMULASI-TEST-001",
    price: 20150,
    message: "Pembelian Token PLN 20.000 Berhasil.",
    raw_response: {
      data: {
        username: "onlimo_user",
        buyer_sku_code: "pln20",
        customer_no: "123456789012",
        ref_id: "PLN-SIMULASI-TEST-001",
        status: "Success",
        rc: "00",
        sn: "5627-8829-1022-7718-9201",
        price: 20150,
        message: "Pembelian Token PLN 20.000 Berhasil.",
        balance: 1500000
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <>
      {/* Tombol Test Floating atau di Pojok */}
      <Button 
        onClick={() => setOpen(true)}
        className="fixed bottom-8 right-8 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl shadow-2xl flex items-center gap-2 h-14 px-6 z-[100] border border-slate-700 active:scale-95 transition-all"
      >
        <FlaskConical className="h-5 w-5 text-emerald-400" />
        <span className="font-black tracking-tight">Simulator Struk PLN</span>
      </Button>

      {/* MODAL STRUK (REPLIKA DARI ASSET-TABLE) */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[32px] p-0 overflow-hidden border-none shadow-2xl max-h-[95vh] flex flex-col">
          {/* Header Card */}
          <div className={cn(
            "p-8 text-center shrink-0 relative overflow-hidden",
            staticData.success ? "bg-emerald-600" : "bg-rose-600"
          )}>
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Zap className="h-24 w-24 text-white" />
            </div>
            
            <div className="flex justify-center mb-4 relative z-10">
              <div className="bg-white p-3 rounded-full shadow-lg shadow-black/10 animate-in zoom-in duration-500">
                <CheckCircle2 className="h-10 w-10 text-emerald-600" />
              </div>
            </div>
            <h2 className="text-2xl font-black text-white relative z-10">{staticData.title}</h2>
            <p className="text-white/80 font-bold text-sm mt-1 relative z-10">{staticData.station_name}</p>
          </div>

          <div className="p-1 pr-1 pl-1 bg-white overflow-y-auto no-scrollbar">
            <div className="bg-white rounded-t-[32px] -mt-6 relative z-20 p-8 space-y-6">
              
              {/* Token Display */}
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[24px] p-6 space-y-4 text-center">
                <div className="flex items-center justify-center gap-2 text-slate-400">
                  <Ticket className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Nomor Token Listrik</span>
                </div>
                <div className="relative">
                  <div className="bg-white rounded-2xl py-6 px-2 border border-slate-100 shadow-sm">
                    <span className="text-3xl font-black text-slate-800 tracking-[0.2em] font-mono break-all px-2">
                      {staticData.sn}
                    </span>
                  </div>
                  <Button 
                    size="icon"
                    variant="secondary"
                    className="absolute -right-2 -bottom-2 h-10 w-10 rounded-full shadow-lg bg-yellow-400 hover:bg-yellow-500 text-slate-900 border-2 border-white"
                    onClick={() => copyToClipboard(staticData.sn)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-[9px] text-slate-400 italic font-bold uppercase tracking-tight">
                  * Contoh tampilan hasil pengisian token listrik
                </p>
              </div>

              {/* Detail Grid */}
              <div className="grid grid-cols-1 gap-1 border-y border-slate-100 py-6">
                <div className="flex justify-between items-center px-2 py-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">ID Pelanggan</span>
                  <span className="text-sm font-black text-slate-700">{staticData.customer_no}</span>
                </div>
                <div className="flex justify-between items-center px-2 py-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">ID Referensi</span>
                  <span className="text-sm font-bold text-slate-700 font-mono text-[10px]">{staticData.ref_id}</span>
                </div>
                <div className="flex justify-between items-center px-2 py-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Harga Provider</span>
                  <span className="text-sm font-black text-emerald-600">Rp {staticData.price.toLocaleString("id-ID")}</span>
                </div>
              </div>

              {/* Status Message */}
              <div className="bg-emerald-50 text-emerald-800 p-4 rounded-2xl flex gap-3 items-start">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <p className="text-xs font-bold leading-relaxed">{staticData.message}</p>
              </div>

              {/* DEBUG SECTION */}
              <div className="pt-2">
                <button 
                  onClick={() => setShowDebug(!showDebug)} 
                  className="flex items-center justify-between w-full hover:bg-slate-50 p-3 rounded-xl transition-colors group border border-transparent hover:border-slate-100"
                >
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-blue-500">
                    <Bug className="h-3 w-3" />
                    Simulated API Response
                  </div>
                  {showDebug ? <ChevronUp className="h-3 w-3 text-slate-400" /> : <ChevronDown className="h-3 w-3 text-slate-400" />}
                </button>
                
                {showDebug && (
                  <div className="mt-3 p-4 bg-slate-900 rounded-[20px] overflow-hidden animate-in slide-in-from-top-2 duration-300">
                    <pre className="text-[10px] text-emerald-400 font-mono leading-relaxed overflow-x-auto whitespace-pre no-scrollbar">
                      {JSON.stringify(staticData.raw_response, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button 
                  className="flex-1 h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-sm flex gap-2"
                  variant="ghost"
                  onClick={() => {
                    const text = `STRUK TOKEN LISTRIK (TEST)\nStasiun: ${staticData.station_name}\nID Pelanggan: ${staticData.customer_no}\nToken: ${staticData.sn}\nRef ID: ${staticData.ref_id}`;
                    copyToClipboard(text);
                  }}
                >
                  <Copy className="h-4 w-4" /> Salin Struk
                </Button>
                <Button 
                  className="flex-[2] h-14 rounded-2xl font-black text-lg transition-all active:scale-95 shadow-lg bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-200"
                  onClick={() => setOpen(false)}
                >
                  Tutup Simulator
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
