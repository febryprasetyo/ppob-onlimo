"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Calculator, ChevronRight, Wifi, Zap, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface OrbitAsset {
  id: number;
  nama_stasiun: string;
  phone_number: string;
}

export function NewInvoiceDialog({ 
  open, 
  onOpenChange, 
  onSuccess 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  onSuccess: (invoice: any) => void;
}) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [orbitAssets, setOrbitAssets] = useState<OrbitAsset[]>([]);
  const [selectedOrbits, setSelectedOrbits] = useState<number[]>([]);
  const [uniqueCode, setUniqueCode] = useState("");
  const [summary, setSummary] = useState<{
    plnTotal: number;
    orbitTotal: number;
    adminFee: number;
  } | null>(null);
  const [period, setPeriod] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  useEffect(() => {
    if (open) {
      setStep(1);
      setUniqueCode("");
      setSummary(null);
      fetch("/api/finance/orbit-assets")
        .then(res => res.json())
        .then(data => setOrbitAssets(data));
    }
  }, [open]);

  const handleNext = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/finance/calculate-total", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selected_orbit_ids: selectedOrbits
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSummary(json.data);
        setStep(2);
      } else {
        alert(json.error);
      }
    } catch (err) {
      alert("Gagal menghitung total.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/finance/generate-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          period_month: period.month,
          period_year: period.year,
          selected_orbit_ids: selectedOrbits,
          unique_code: parseInt(uniqueCode || "0")
        }),
      });
      const data = await res.json();
      if (data.success) {
        onSuccess(data.invoice);
        onOpenChange(false);
      } else {
        alert(data.error);
      }
    } catch (error) {
      alert("Gagal membuat pengajuan.");
    } finally {
      setLoading(false);
    }
  };

  const toggleOrbit = (id: number) => {
    setSelectedOrbits(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleAllOrbits = () => {
    if (selectedOrbits.length === orbitAssets.length) {
      setSelectedOrbits([]);
    } else {
      setSelectedOrbits(orbitAssets.map(a => a.id));
    }
  };

  const totalAmount = (summary?.plnTotal || 0) + (summary?.orbitTotal || 0) + (summary?.adminFee || 0) + parseInt(uniqueCode || "0");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl">
        <DialogHeader className="p-8 pb-4 bg-white border-b border-slate-50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20">
              <Calculator className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Buat Pengajuan Deposit</DialogTitle>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Langkah {step} dari 2</p>
            </div>
          </div>
        </DialogHeader>
        
        <div className="p-8 space-y-8 overflow-y-auto no-scrollbar bg-white">
          {step === 1 ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              {/* Period Selection */}
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 grid grid-cols-2 gap-6 shadow-inner">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] pl-1">Bulan Periode</Label>
                  <select 
                    className="w-full h-14 px-5 rounded-2xl border-2 border-slate-100 bg-white font-bold text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all cursor-pointer hover:border-slate-200"
                    value={period.month}
                    onChange={(e) => setPeriod({...period, month: parseInt(e.target.value)})}
                  >
                    {[...Array(12)].map((_, i) => (
                      <option key={i+1} value={i+1}>{new Date(2024, i).toLocaleString('id-ID', {month: 'long'})}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] pl-1">Tahun Anggaran</Label>
                  <Input 
                    type="number" 
                    className="h-14 px-5 rounded-2xl border-2 border-slate-100 bg-white font-bold text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all"
                    value={period.year} 
                    onChange={(e) => setPeriod({...period, year: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div className="space-y-1">
                    <Label className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
                       Pilih Modem Orbit 
                       <Badge variant="outline" className="rounded-full bg-blue-50 text-blue-600 border-blue-100 font-black text-[9px] uppercase tracking-widest">{selectedOrbits.length} terpilih</Badge>
                    </Label>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pilih aset yang akan dilakukan pengisian paket data</p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all" onClick={toggleAllOrbits}>
                    {selectedOrbits.length === orbitAssets.length ? "Lepas Semua" : "Pilih Semua"}
                  </Button>
                </div>
                <div className="border border-slate-100 rounded-[2rem] bg-slate-50/30 overflow-hidden shadow-sm">
                  <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto no-scrollbar">
                    {orbitAssets.length === 0 ? (
                      <div className="p-8 text-center text-slate-300 italic flex flex-col items-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Memuat database aset...</p>
                      </div>
                    ) : (
                      orbitAssets.map((asset) => (
                        <div key={asset.id} className="group flex items-center gap-4 p-4 hover:bg-white transition-all cursor-pointer" onClick={() => toggleOrbit(asset.id)}>
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                            selectedOrbits.includes(asset.id) ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" : "bg-white text-slate-300 border border-slate-200"
                          )}>
                             <Checkbox 
                               id={`orbit-${asset.id}`} 
                               className="hidden"
                               checked={selectedOrbits.includes(asset.id)}
                            />
                            <Wifi className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <p className="font-black text-slate-700 text-sm tracking-tight">{asset.nama_stasiun}</p>
                            <p className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-widest mt-0.5">{asset.phone_number}</p>
                          </div>
                          {selectedOrbits.includes(asset.id) && (
                            <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-blue-600" />
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 px-2">
                  <Zap className="h-3 w-3 text-amber-500 fill-amber-500" />
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Aset PLN dialokasikan otomatis untuk seluruh aset aktif.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
               <div className="p-6 rounded-[2.5rem] border-2 border-slate-100 bg-slate-50/30 space-y-6">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] pl-2">Rincian Anggaran Diajukan</Label>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-5 bg-white rounded-3xl border border-slate-100 shadow-sm group hover:scale-[1.02] transition-all duration-300">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                          <Zap className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Tagihan PLN</p>
                          <p className="font-black text-slate-700 tracking-tight">Listrik Stasiun</p>
                        </div>
                      </div>
                      <p className="text-lg font-black text-slate-900 tabular-nums">Rp {summary?.plnTotal.toLocaleString("id-ID")}</p>
                    </div>

                    <div className="flex justify-between items-center p-5 bg-white rounded-3xl border border-slate-100 shadow-sm group hover:scale-[1.02] transition-all duration-300">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                          <Wifi className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Paket Data Orbit</p>
                          <p className="font-black text-slate-700 tracking-tight">{selectedOrbits.length} Aset</p>
                        </div>
                      </div>
                      <p className="text-lg font-black text-slate-900 tabular-nums">Rp {summary?.orbitTotal.toLocaleString("id-ID")}</p>
                    </div>

                    <div className="flex justify-between items-center p-5 bg-white rounded-3xl border border-slate-100 shadow-sm group hover:scale-[1.02] transition-all duration-300">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                          <CreditCard className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Biaya Admin Bank</p>
                          <p className="font-black text-slate-700 tracking-tight">VA Fee</p>
                        </div>
                      </div>
                      <p className="text-lg font-black text-slate-900 tabular-nums">Rp {summary?.adminFee.toLocaleString("id-ID")}</p>
                    </div>

                    <div className="bg-blue-600 p-6 rounded-3xl shadow-xl shadow-blue-600/20 group hover:scale-[1.02] transition-all duration-300 border-2 border-blue-500">
                       <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label className="text-[10px] font-black uppercase text-blue-100 tracking-[0.2em]">Kode Unik Transaksi</Label>
                            <span className="text-[9px] font-bold text-blue-200 uppercase tracking-wider bg-blue-700/50 px-2 py-1 rounded-lg">Wajib Diisi</span>
                          </div>
                          <div className="relative">
                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-300 font-bold text-lg">Rp</div>
                            <Input 
                              type="text"
                              inputMode="numeric"
                              placeholder="000"
                              className="h-16 pl-14 pr-6 rounded-2xl border-none bg-blue-700/30 text-white font-black text-2xl placeholder:text-blue-400/50 focus:ring-0 focus:bg-blue-700/50 transition-all outline-none tabular-nums"
                              value={uniqueCode}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, "");
                                setUniqueCode(val);
                              }}
                            />
                          </div>
                       </div>
                    </div>
                  </div>
               </div>

               <div className="px-6 py-4 rounded-3xl bg-slate-900 flex justify-between items-center shadow-2xl">
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Grand Total Pengajuan</p>
                    <p className="text-3xl font-black text-emerald-400 tabular-nums tracking-tighter">Rp {totalAmount.toLocaleString("id-ID")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Estimasi Saldo Akhir</p>
                    <div className="flex items-center gap-2 text-white/50 text-xs font-bold font-mono">
                      <span>{period.month}/{period.year}</span>
                    </div>
                  </div>
               </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-8 bg-slate-50 border-t border-slate-100">
          <div className="flex items-center justify-between w-full">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Sistem Keuangan Mandiri
            </div>
            <div className="flex gap-3">
              <Button 
                variant="ghost" 
                onClick={() => step === 1 ? onOpenChange(false) : setStep(1)}
                className="h-14 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all"
              >
                {step === 1 ? "Batal" : "Kembali"}
              </Button>
              {step === 1 ? (
                <Button 
                  onClick={handleNext} 
                  disabled={loading} 
                  className="h-14 px-10 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex gap-3"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                  Lanjut Ke Ringkasan
                </Button>
              ) : (
                <Button 
                  onClick={handleGenerate} 
                  disabled={loading || !uniqueCode} 
                  className="h-14 px-10 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex gap-3"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
                  Konfirmasi & Buat Invoice
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
