"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Zap, Save, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

export default function CheckPlnPage() {
  const [customerNo, setCustomerNo] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // For Saving Asset
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [namaLokasi, setNamaLokasi] = useState("");
  const [waOperator, setWaOperator] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerNo) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/digiflazz/check-pln", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_no: customerNo }),
      });

      const data = await res.json();
      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error || "Gagal memvalidasi ID PLN");
      }
    } catch (err) {
      setError("Terjadi kesalahan koneksi ke server");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAsset = async () => {
    if (!namaLokasi || !waOperator) {
      alert("Mohon lengkapi Nama Lokasi dan WA Operator");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/assets/pln", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama_stasiun: namaLokasi,
          meter_number: result.customer_no,
          operator_wa: waOperator,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert("Aset berhasil disimpan!");
        setSaveDialogOpen(false);
        setCustomerNo("");
        setResult(null);
        setNamaLokasi("");
        setWaOperator("");
      } else {
        alert(`Gagal: ${data.error}`);
      }
    } catch (err) {
      alert("Terjadi kesalahan saat menyimpan aset");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-slide-in-bottom max-w-2xl mx-auto">
      <div className="flex flex-col items-center text-center gap-4">
        <div className="p-4 premium-gradient rounded-3xl shadow-2xl shadow-blue-500/20">
          <Zap className="h-10 w-10 text-white" />
        </div>
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Validasi Pelanggan PLN</h1>
          <p className="text-slate-500 mt-2 font-bold text-sm uppercase tracking-widest">Realtime Inquiry • PLN Prabayar Unit</p>
        </div>
      </div>

      <Card className="border-none shadow-2xl shadow-slate-200/60 overflow-hidden rounded-[2.5rem] bg-white group">
        <div className="p-8 md:p-12 space-y-8">
          <div className="space-y-4">
            <Label htmlFor="customerNo" className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 pl-1">Input ID Pelanggan / Nomor Meter</Label>
            <form onSubmit={handleCheck} className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Input
                  id="customerNo"
                  placeholder="Contoh: 14080123456"
                  value={customerNo}
                  onChange={(e) => setCustomerNo(e.target.value)}
                  className="h-16 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-black tracking-[0.2em] text-center text-lg pl-12 pr-4 shadow-sm"
                />
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 pointer-events-none" />
              </div>
              <Button type="submit" className="premium-gradient hover:opacity-95 text-white h-16 rounded-2xl px-10 font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex gap-3 min-w-[160px]" disabled={loading}>
                {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                {loading ? "CHECKING..." : "Cek ID"}
              </Button>
            </form>
          </div>

          {error && (
            <div className="p-6 rounded-2xl bg-rose-50 text-rose-700 flex items-center gap-4 border border-rose-100 animate-in zoom-in-95 duration-300">
              <div className="p-2 bg-white rounded-xl shadow-sm">
                <AlertCircle className="h-6 w-6 text-rose-500" />
              </div>
              <p className="text-sm font-black uppercase tracking-tight">{error}</p>
            </div>
          )}

          {result && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
              <div className="p-8 rounded-[2rem] bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Zap className="h-32 w-32 text-white" />
                </div>
                
                <div className="relative z-10 space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                      <CheckCircle2 className="h-4 w-4" /> Valid Data Found
                    </div>
                    <span className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em]">PLN Inquiry Service</span>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-1">Nama Customer</span>
                      <span className="text-2xl font-black tracking-tight uppercase truncate">{result.name || result.customer_name}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4 border-t border-white/10">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-1">ID Pelanggan</span>
                        <span className="text-lg font-black tracking-widest font-mono text-white/90">{result.customer_no}</span>
                      </div>
                      <div className="flex flex-col items-start sm:items-end">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-1">Tarif / Daya</span>
                        <span className="text-lg font-black text-emerald-400 uppercase">{result.segment_power}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full h-18 rounded-[1.5rem] premium-gradient hover:opacity-95 text-white shadow-2xl shadow-blue-500/30 transition-all active:scale-95 flex items-center justify-center gap-4 font-black uppercase text-sm tracking-[0.2em]">
                    <Save className="h-6 w-6" /> Simpan ke Database Aset
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[550px] rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl">
                  <div className="premium-gradient p-10 text-white">
                    <DialogHeader>
                      <DialogTitle className="text-3xl font-black tracking-tight">Daftarkan Aset</DialogTitle>
                      <DialogDescription className="text-blue-100 font-bold text-sm mt-3 leading-relaxed">
                        Anda akan mendaftarkan <strong className="text-white uppercase px-1.5 bg-white/10 rounded">{result.customer_name || result.name}</strong> ke dalam unit monitoring stasiun.
                      </DialogDescription>
                    </DialogHeader>
                  </div>
                  
                  <div className="p-10 space-y-8 bg-white">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="lokasi" className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 pl-1">Nama Lokasi / Identitas Stasiun</Label>
                        <Input
                          id="lokasi"
                          placeholder="Contoh: Pos Pantau Banjir Gedebage"
                          value={namaLokasi}
                          onChange={(e) => setNamaLokasi(e.target.value)}
                          className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-bold text-slate-700"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="wa" className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 pl-1">WhatsApp Peranggung Jawab (PJ)</Label>
                        <Input
                          id="wa"
                          placeholder="Nomor WA untuk notifikasi otomatis"
                          value={waOperator}
                          onChange={(e) => setWaOperator(e.target.value)}
                          className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-bold text-slate-700"
                        />
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-3">
                      <Button onClick={handleSaveAsset} disabled={saving} className="w-full h-16 rounded-2xl premium-gradient text-white font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
                        {saving ? <RefreshCw className="h-5 w-5 animate-spin mr-3" /> : <CheckCircle2 className="h-5 w-5 mr-3" />}
                        {saving ? "REGISTRATION..." : "Daftarkan Sekarang"}
                      </Button>
                      <Button variant="ghost" onClick={() => setSaveDialogOpen(false)} className="h-14 rounded-2xl font-bold text-slate-400 hover:text-slate-600">Batalkan</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </Card>
      
      <div className="text-center">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">Realtime Synchronization Engine</p>
      </div>
    </div>
  );
}
