"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Plus, 
  Zap, 
  Wifi, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Trash2, 
  Search,
  MessageCircle,
  Database,
  XCircle,
  Pencil,
  Phone
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export default function AssetsPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Alert State
  const [alertConfig, setAlertConfig] = useState<{
    open: boolean;
    type: "success" | "error";
    title: string;
    message: string;
  }>({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  // Edit WA Modal State
  const [editWaModal, setEditWaModal] = useState<{
    open: boolean;
    nama_stasiun: string;
    operator_wa: string;
    pln_id?: number;
    orbit_id?: number;
  }>({
    open: false,
    nama_stasiun: "",
    operator_wa: "",
  });
  const [updatingWa, setUpdatingWa] = useState(false);

  // Form States
  const [saving, setSaving] = useState(false);
  const [verifyingPln, setVerifyingPln] = useState(false);
  const [verifiedPln, setVerifiedPln] = useState(false);
  const [formData, setFormData] = useState({
    nama_stasiun: "",
    meter_number: "",
    phone_number: "",
    operator_wa: "",
    verified_name: "",
    segment_power: "",
    pln_sku: "pln100",
    orbit_sku: "orbit20",
    provinsi: "",
    kabupaten: "",
    detail_lokasi: "",
    keterangan: "",
  });

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/assets");
      const json = await res.json();
      if (json.success) {
        setAssets(json.data);
      }
    } catch (err) {
      console.error("Fetch assets failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOperatorWa = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingWa(true);
    try {
      const res = await fetch("/api/assets/update-operator-wa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama_stasiun: editWaModal.nama_stasiun,
          operator_wa: editWaModal.operator_wa,
          pln_id: editWaModal.pln_id,
          orbit_id: editWaModal.orbit_id,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setEditWaModal((prev) => ({ ...prev, open: false }));
        showAlert("success", "Berhasil Diperbarui", `Nomor WA operator untuk stasiun ${editWaModal.nama_stasiun} telah diperbarui.`);
        fetchAssets();
      } else {
        showAlert("error", "Gagal Memperbarui", json.error || "Gagal memperbarui nomor WA.");
      }
    } catch (err: any) {
      showAlert("error", "Kesalahan Sistem", err.message || "Terjadi kesalahan koneksi.");
    } finally {
      setUpdatingWa(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const showAlert = (type: "success" | "error", title: string, message: string) => {
    setAlertConfig({ open: true, type, title, message });
  };

  const handleVerifyPln = async () => {
    if (!formData.meter_number) return;
    setVerifyingPln(true);
    setVerifiedPln(false);
    try {
      const res = await fetch("/api/digiflazz/check-pln", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_no: formData.meter_number }),
      });
      const json = await res.json();
      if (json.success) {
        setFormData({ 
          ...formData, 
          verified_name: json.data.customer_name || json.data.name,
          segment_power: json.data.segment_power || ""
        });
        setVerifiedPln(true);
        // Optional: show a small success indication or keep as is since it updates the UI
      } else {
        showAlert("error", "Verifikasi Gagal", json.error || "Nomor pelanggan tidak ditemukan atau sedang gangguan.");
      }
    } catch (err) {
      showAlert("error", "Kesalahan Sistem", "Terjadi kesalahan koneksi saat menghubungi server verifikasi.");
    } finally {
      setVerifyingPln(false);
    }
  };

  const handleSaveAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasi PLN Wajib & Harus Verifikasi
    if (!formData.meter_number) {
      showAlert("error", "Data Tidak Lengkap", "ID Pelanggan PLN wajib diisi.");
      return;
    }
    
    if (!verifiedPln) {
      showAlert("error", "Verifikasi Diperlukan", "Silakan verifikasi nomor PLN terlebih dahulu sebelum menyimpan.");
      return;
    }

    setSaving(true);
    try {
      // Simpan PLN (Wajib)
      const plnRes = await fetch("/api/assets/pln", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama_stasiun: formData.nama_stasiun,
          meter_number: formData.meter_number,
          operator_wa: formData.operator_wa,
          customer_name: formData.verified_name,
          segment_power: formData.segment_power,
          default_sku: formData.pln_sku,
          provinsi: formData.provinsi,
          kabupaten: formData.kabupaten,
          detail_lokasi: formData.detail_lokasi,
          keterangan: formData.keterangan
        }),
      });

      const plnJson = await plnRes.json();
      if (!plnJson.success) throw new Error(plnJson.error || "Gagal menyimpan data PLN");

      // Simpan Orbit jika ada
      if (formData.phone_number) {
        const orbitRes = await fetch("/api/assets/orbit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nama_stasiun: formData.nama_stasiun,
            phone_number: formData.phone_number,
            operator_wa: formData.operator_wa,
            default_sku: formData.orbit_sku,
            provinsi: formData.provinsi,
            kabupaten: formData.kabupaten,
            detail_lokasi: formData.detail_lokasi,
            keterangan: formData.keterangan
          }),
        });
        const orbitJson = await orbitRes.json();
        if (!orbitJson.success) throw new Error(orbitJson.error || "Gagal menyimpan data Orbit");
      }

      showAlert("success", "Berhasil Tersimpan", `Aset untuk stasiun ${formData.nama_stasiun} telah berhasil didaftarkan ke sistem.`);
      setIsModalOpen(false);
      setFormData({
        nama_stasiun: "",
        meter_number: "",
        phone_number: "",
        operator_wa: "",
        verified_name: "",
        segment_power: "",
        pln_sku: "pln100",
        orbit_sku: "orbit20",
        provinsi: "",
        kabupaten: "",
        detail_lokasi: "",
        keterangan: "",
      });
      setVerifiedPln(false);
      fetchAssets();
    } catch (err: any) {
      showAlert("error", "Gagal Menyimpan", err.message || "Terjadi kesalahan saat mencoba menyimpan data aset.");
    } finally {
      setSaving(false);
    }
  };

  const filteredAssets = assets.filter(a => 
    a.nama_stasiun.toLowerCase().includes(search.toLowerCase()) ||
    a.meter_number.includes(search) ||
    a.phone_number.includes(search)
  );

  return (
    <div className="space-y-8 animate-slide-in-bottom">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black tracking-tight text-slate-900 flex items-center gap-4">
            <div className="p-3 premium-gradient rounded-2xl shadow-xl shadow-blue-500/20">
              <Database className="h-8 w-8 text-white" />
            </div>
            <span className="text-gradient">Manajemen Aset</span>
          </h1>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-widest pl-1 border-l-4 border-blue-500 ml-1">
            Core Infrastructure Manager • Automated Unit Tracking
          </p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="premium-gradient hover:opacity-90 text-white shadow-xl shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-3 rounded-2xl h-14 px-8 font-black uppercase text-xs tracking-widest">
              <Plus className="h-5 w-5" />
              Tambah Aset Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
            <div className="premium-gradient p-8 text-white">
              <DialogHeader>
                <DialogTitle className="text-3xl font-black tracking-tight">Pendaftaran Aset</DialogTitle>
                <DialogDescription className="text-blue-100 font-medium text-sm mt-2">
                  ID Pelanggan PLN wajib diverifikasi secara realtime sebelum data disimpan ke database.
                </DialogDescription>
              </DialogHeader>
            </div>
            
            <div className="p-8">
              <form onSubmit={handleSaveAsset} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="nama_stasiun" className="font-black text-[10px] uppercase tracking-widest text-slate-400 pl-1">Nama Stasiun / Lokasi</Label>
                  <Input 
                    id="nama_stasiun" 
                    placeholder="e.g. Pos Pantau A - Jakarta" 
                    value={formData.nama_stasiun}
                    onChange={(e) => setFormData({...formData, nama_stasiun: e.target.value})}
                    required 
                    className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-bold text-slate-700"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="meter_number" className="font-black text-[10px] uppercase tracking-widest text-slate-400 pl-1 flex items-center gap-2">
                    ID Pelanggan PLN <span className="text-rose-500">*</span>
                  </Label>
                  <div className="flex gap-3">
                    <Input 
                      id="meter_number" 
                      placeholder="Input 12 digit ID PLN" 
                      value={formData.meter_number}
                      onChange={(e) => {
                        setFormData({...formData, meter_number: e.target.value});
                        setVerifiedPln(false);
                        setFormData(prev => ({ ...prev, verified_name: "", segment_power: "" }));
                      }}
                      required
                      className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-black tracking-[0.2em] text-center"
                    />
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={handleVerifyPln}
                      disabled={verifyingPln || !formData.meter_number}
                      className={cn(
                        "shrink-0 h-14 px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all",
                        verifiedPln ? "border-emerald-200 text-emerald-600 bg-emerald-50 shadow-inner" : "border-blue-200 text-blue-600 bg-blue-50/50"
                      )}
                    >
                      {verifyingPln ? <Loader2 className="h-5 w-5 animate-spin" /> : verifiedPln ? "VERIFIED" : "VERIFY NOW"}
                    </Button>
                  </div>
                  {verifiedPln && (
                    <div className="p-4 bg-emerald-50/50 text-emerald-700 rounded-2xl border border-emerald-100/50 animate-in zoom-in-95 duration-300">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Nama Pelanggan</span>
                          <span className="text-sm font-black whitespace-nowrap overflow-hidden text-ellipsis uppercase">{formData.verified_name}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="pln_sku" className="font-black text-[10px] uppercase tracking-widest text-slate-400 pl-1">SKU PLN (Default)</Label>
                    <select 
                      id="pln_sku"
                      className="w-full h-14 rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-2 text-sm font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
                      value={formData.pln_sku}
                      onChange={(e) => setFormData({...formData, pln_sku: e.target.value})}
                    >
                      <option value="pln100">PLN 100.000</option>
                      <option value="pln200">PLN 200.000</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone_number" className="font-black text-[10px] uppercase tracking-widest text-slate-400 pl-1">ID / Nomor Orbit</Label>
                    <Input 
                      id="phone_number" 
                      placeholder="e.g. 0812XXXXXXXX" 
                      value={formData.phone_number}
                      onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                      className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="operator_wa" className="font-black text-[10px] uppercase tracking-widest text-slate-400 pl-1">Nomor WA Penangung Jawab</Label>
                  <Input 
                    id="operator_wa" 
                    placeholder="e.g. 0878XXXXXXXX" 
                    value={formData.operator_wa}
                    onChange={(e) => setFormData({...formData, operator_wa: e.target.value})}
                    required
                    className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-bold"
                  />
                </div>

                {/* Informasi Lokasi */}
                <div className="pt-2 border-t border-slate-100">
                  <p className="font-black text-[10px] uppercase tracking-widest text-slate-400 pl-1 mb-4">Informasi Lokasi (Untuk Laporan PDF)</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="provinsi" className="font-black text-[10px] uppercase tracking-widest text-slate-400 pl-1">Provinsi</Label>
                      <Input 
                        id="provinsi" 
                        placeholder="e.g. Nusa Tenggara Barat" 
                        value={formData.provinsi}
                        onChange={(e) => setFormData({...formData, provinsi: e.target.value})}
                        className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="kabupaten" className="font-black text-[10px] uppercase tracking-widest text-slate-400 pl-1">Kabupaten / Kota</Label>
                      <Input 
                        id="kabupaten" 
                        placeholder="e.g. Kabupaten Sumbawa" 
                        value={formData.kabupaten}
                        onChange={(e) => setFormData({...formData, kabupaten: e.target.value})}
                        className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-bold"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="detail_lokasi" className="font-black text-[10px] uppercase tracking-widest text-slate-400 pl-1">Detail Lokasi</Label>
                      <Input 
                        id="detail_lokasi" 
                        placeholder="e.g. Bendungan Mamak" 
                        value={formData.detail_lokasi}
                        onChange={(e) => setFormData({...formData, detail_lokasi: e.target.value})}
                        className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="keterangan" className="font-black text-[10px] uppercase tracking-widest text-slate-400 pl-1">Keterangan</Label>
                      <Input 
                        id="keterangan" 
                        placeholder="e.g. Daya pompa 1.5 HP" 
                        value={formData.keterangan}
                        onChange={(e) => setFormData({...formData, keterangan: e.target.value})}
                        className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-bold"
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter className="pt-4">
                  <Button 
                    type="submit" 
                    disabled={saving || !verifiedPln}
                    className="w-full premium-gradient hover:opacity-90 h-16 rounded-2xl text-lg font-black uppercase tracking-widest text-white shadow-2xl shadow-blue-500/20 transition-all active:scale-95"
                  >
                    {saving ? <Loader2 className="h-6 w-6 animate-spin mr-3" /> : "Simpan & Daftarkan Aset"}
                  </Button>
                </DialogFooter>
              </form>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table Section */}
      <Card className="border-none shadow-2xl shadow-slate-200/50 overflow-hidden rounded-[2.5rem] bg-white group mt-4">
        <div className="p-6 md:p-8 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100">
          <div className="relative group/search max-w-2xl">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within/search:text-blue-500 transition-colors" />
            <Input
              placeholder="Cari lokasi stasiun, ID Pelanggan, atau nomor Orbit..."
              className="pl-14 h-16 bg-white border-slate-100 shadow-sm focus-visible:ring-4 focus-visible:ring-blue-500/10 text-base font-bold rounded-[1.25rem] transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto no-scrollbar">
            <Table>
              <TableHeader className="bg-slate-50/80 sticky top-0 z-10 backdrop-blur-md">
                <TableRow className="border-slate-100">
                  <TableHead className="font-extrabold text-slate-600 py-5 pl-8 uppercase tracking-widest text-[10px]">Stasiun / Lokasi</TableHead>
                  <TableHead className="font-extrabold text-slate-600 uppercase tracking-widest text-[10px]">Detail PLN</TableHead>
                  <TableHead className="font-extrabold text-slate-600 uppercase tracking-widest text-[10px]">SKU PLN</TableHead>
                  <TableHead className="font-extrabold text-slate-600 uppercase tracking-widest text-[10px]">Detail Orbit</TableHead>
                  <TableHead className="font-extrabold text-slate-600 uppercase tracking-widest text-[10px]">SKU Orbit</TableHead>
                  <TableHead className="font-extrabold text-slate-600 uppercase tracking-widest text-[10px]">Kontak Operator</TableHead>
                  <TableHead className="font-extrabold text-slate-600 text-center pr-8 uppercase tracking-widest text-[10px]">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="border-slate-50">
                      <TableCell colSpan={7} className="py-6 pl-8">
                        <div className="w-full h-10 bg-slate-100/50 rounded-xl animate-pulse" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredAssets.length > 0 ? (
                  filteredAssets.map((asset, idx) => (
                    <TableRow key={idx} className="group hover:bg-slate-50/40 transition-all border-slate-50">
                      <TableCell className="py-5 pl-8">
                        <div className="font-bold text-slate-800">{asset.nama_stasiun}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 uppercase font-bold tracking-wider">Stasiun Onlimo</div>
                      </TableCell>
                      <TableCell>
                        {asset.meter_number ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Zap className="h-3.5 w-3.5 text-yellow-500" />
                              <code className="font-black text-slate-700">{asset.meter_number}</code>
                            </div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase truncate max-w-[150px]">{asset.customer_name || "METERAN LISTRIK"}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-300 italic">No PLN Info</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {asset.meter_number && (
                          <Badge variant="outline" className="font-mono text-[10px] bg-yellow-50 text-yellow-700 border-yellow-100">
                            {asset.pln_sku || "pln100"}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {asset.phone_number ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Wifi className="h-3.5 w-3.5 text-blue-500" />
                              <code className="font-black text-slate-700">{asset.phone_number}</code>
                            </div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase">Internet Modem</div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-300 italic">No Orbit Info</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {asset.phone_number && (
                          <Badge variant="outline" className="font-mono text-[10px] bg-blue-50 text-blue-700 border-blue-100">
                            {asset.orbit_sku || "orbit20"}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div 
                          onClick={() => setEditWaModal({
                            open: true,
                            nama_stasiun: asset.nama_stasiun,
                            operator_wa: asset.operator_wa || "",
                            pln_id: asset.pln_id,
                            orbit_id: asset.orbit_id,
                          })}
                          className="flex items-center gap-2 group/wa cursor-pointer hover:bg-slate-100/80 p-2 rounded-xl transition-all w-fit"
                          title="Klik untuk edit nomor WhatsApp operator"
                        >
                          <div className="p-1.5 bg-emerald-50 rounded-lg group-hover/wa:bg-emerald-500 transition-colors">
                            <MessageCircle className="h-4 w-4 text-emerald-500 group-hover/wa:text-white" />
                          </div>
                          <span className="text-sm font-bold text-slate-600 group-hover/wa:text-blue-600 transition-colors">
                            {asset.operator_wa || <span className="text-xs text-rose-400 italic">Belum ada nomor WA</span>}
                          </span>
                          <Pencil className="h-3.5 w-3.5 text-slate-400 group-hover/wa:text-blue-500 opacity-0 group-hover/wa:opacity-100 transition-opacity ml-1" />
                        </div>
                      </TableCell>
                      <TableCell className="text-center pr-8">
                        <div className="flex items-center justify-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setEditWaModal({
                              open: true,
                              nama_stasiun: asset.nama_stasiun,
                              operator_wa: asset.operator_wa || "",
                              pln_id: asset.pln_id,
                              orbit_id: asset.orbit_id,
                            })}
                            title="Edit Kontak WA Operator"
                            className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all h-9 w-9"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all h-9 w-9"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center gap-4 text-slate-300">
                        <Database className="h-16 w-16 opacity-10" />
                        <p className="text-lg font-bold text-slate-400 italic">Belum ada data stasiun</p>
                        <Button variant="outline" onClick={() => setIsModalOpen(true)} className="mt-4 rounded-xl font-bold">Daftarkan Stasiun Baru</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Footer Info */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase tracking-[0.2em] px-4">
        <span>Unit Stasiun Terdaftar: {filteredAssets.length}</span>
        <span>Operational Assets Manager • Ver 1.0.5</span>
      </div>

      {/* EDIT OPERATOR WA MODAL */}
      <Dialog open={editWaModal.open} onOpenChange={(open) => setEditWaModal(prev => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-[450px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <div className="premium-gradient p-8 text-white">
            <DialogHeader>
              <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center mb-3 shadow-md">
                <Phone className="h-6 w-6 text-white" />
              </div>
              <DialogTitle className="text-2xl font-black tracking-tight">Edit Nomor Kontak WA</DialogTitle>
              <DialogDescription className="text-blue-100 font-medium text-xs mt-1">
                Perbarui nomor WhatsApp penanggung jawab / operator untuk stasiun ini.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-8">
            <form onSubmit={handleSaveOperatorWa} className="space-y-6">
              <div className="space-y-2">
                <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400 pl-1">
                  ID / Nama Stasiun
                </Label>
                <div className="h-14 px-5 rounded-2xl border border-slate-100 bg-slate-100/60 flex items-center font-black text-slate-800 text-base">
                  {editWaModal.nama_stasiun}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_operator_wa" className="font-black text-[10px] uppercase tracking-widest text-slate-400 pl-1 flex items-center gap-2">
                  Nomor WhatsApp Operator <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <MessageCircle className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-500" />
                  <Input 
                    id="edit_operator_wa" 
                    placeholder="e.g. 0878XXXXXXXX / 628XXXXXXXX" 
                    value={editWaModal.operator_wa}
                    onChange={(e) => setEditWaModal({ ...editWaModal, operator_wa: e.target.value })}
                    required 
                    className="h-14 pl-14 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all font-mono font-bold text-slate-800 text-base"
                  />
                </div>
                <p className="text-[11px] text-slate-400 font-medium pl-1">
                  Format disarankan menggunakan awalan 08... atau 628...
                </p>
              </div>

              <DialogFooter className="pt-2 flex gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditWaModal(prev => ({ ...prev, open: false }))}
                  className="flex-1 h-14 rounded-2xl font-black uppercase text-xs tracking-widest text-slate-600 border-slate-200"
                >
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  disabled={updatingWa || !editWaModal.operator_wa.trim()}
                  className="flex-1 premium-gradient hover:opacity-95 text-white h-14 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
                >
                  {updatingWa ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : "Simpan Nomor WA"}
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* SUCCESS / ERROR ALERT MODAL */}
      <Dialog open={alertConfig.open} onOpenChange={(open) => setAlertConfig(prev => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-[400px] rounded-[32px] p-8 text-center border-none shadow-2xl">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className={cn(
              "h-20 w-20 rounded-full flex items-center justify-center animate-in zoom-in duration-300",
              alertConfig.type === "success" ? "bg-emerald-50 text-emerald-500" : "bg-rose-50 text-rose-500"
            )}>
              {alertConfig.type === "success" ? (
                <CheckCircle2 className="h-12 w-12" />
              ) : (
                <XCircle className="h-12 w-12" />
              )}
            </div>
            
            <div className="space-y-2">
              <DialogTitle className="text-2xl font-black text-slate-900">{alertConfig.title}</DialogTitle>
              <DialogDescription className="text-sm font-semibold text-slate-500 leading-relaxed">
                {alertConfig.message}
              </DialogDescription>
            </div>

            <Button 
              onClick={() => setAlertConfig(prev => ({ ...prev, open: false }))}
              className={cn(
                "w-full h-12 rounded-2xl font-bold text-base shadow-lg transition-all active:scale-95 mt-4",
                alertConfig.type === "success" ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-100" : "bg-rose-500 hover:bg-rose-600 shadow-rose-100"
              )}
            >
              Mengerti
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
