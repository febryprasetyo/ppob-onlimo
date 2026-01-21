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
import { Loader2, Calculator } from "lucide-react";

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
  const [loading, setLoading] = useState(false);
  const [orbitAssets, setOrbitAssets] = useState<OrbitAsset[]>([]);
  const [selectedOrbits, setSelectedOrbits] = useState<number[]>([]);
  const [period, setPeriod] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  useEffect(() => {
    if (open) {
      fetch("/api/finance/orbit-assets")
        .then(res => res.json())
        .then(data => setOrbitAssets(data));
    }
  }, [open]);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/finance/generate-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          period_month: period.month,
          period_year: period.year,
          selected_orbit_ids: selectedOrbits
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-black text-slate-900">Buat Pengajuan Deposit Dana</DialogTitle>
        </DialogHeader>
        
        <div className="p-6 space-y-8 overflow-y-auto no-scrollbar">
          {/* Period Selection */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase text-slate-400 tracking-widest pl-1">Bulan Periode</Label>
              <select 
                className="w-full h-12 px-4 rounded-xl border bg-white font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={period.month}
                onChange={(e) => setPeriod({...period, month: parseInt(e.target.value)})}
              >
                {[...Array(12)].map((_, i) => (
                  <option key={i+1} value={i+1}>{new Date(2024, i).toLocaleString('id-ID', {month: 'long'})}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase text-slate-400 tracking-widest pl-1">Tahun</Label>
              <Input 
                type="number" 
                className="h-12 px-4 rounded-xl border bg-white font-bold text-slate-700"
                value={period.year} 
                onChange={(e) => setPeriod({...period, year: parseInt(e.target.value)})}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-bold text-blue-600">Pilih Modem Orbit (Manual Checklist)</Label>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={toggleAllOrbits}>
                {selectedOrbits.length === orbitAssets.length ? "Deselect All" : "Select All"}
              </Button>
            </div>
            <div className="border rounded-xl divide-y max-h-48 overflow-y-auto no-scrollbar">
              {orbitAssets.length === 0 ? (
                <div className="p-4 text-center text-slate-400 italic">Memuat aset...</div>
              ) : (
                orbitAssets.map((asset) => (
                  <div key={asset.id} className="flex items-center gap-3 p-3 hover:bg-slate-50">
                    <Checkbox 
                      id={`orbit-${asset.id}`} 
                      checked={selectedOrbits.includes(asset.id)}
                      onCheckedChange={() => toggleOrbit(asset.id)}
                    />
                    <Label htmlFor={`orbit-${asset.id}`} className="flex-1 cursor-pointer">
                      <p className="font-bold text-sm">{asset.nama_stasiun}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{asset.phone_number}</p>
                    </Label>
                  </div>
                ))
              )}
            </div>
            <p className="text-[10px] text-slate-400">* Aset PLN akan dimasukkan secara otomatis (Semua Aset Aktif).</p>
          </div>
        </div>

        <DialogFooter className="p-6 bg-slate-50">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm font-bold text-slate-500">
              Total {selectedOrbits.length} Orbit dipilih
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Batal</Button>
              <Button onClick={handleGenerate} disabled={loading} className="gap-2 bg-blue-600 hover:bg-blue-700">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
                Generate Invoice
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
