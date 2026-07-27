"use client";

import { useRef, useState, useEffect } from "react";
import { Receipt, Download, Loader2, Search, Filter, Zap, Wifi, Printer, Edit3 } from "lucide-react";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ReportSummaryTable } from "./components/ReportSummaryTable";
import { ReceiptGrid } from "./components/ReceiptGrid";
import { handlePrintWithTitle } from "./utils/print-helper";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface AssetData {
  id: number;
  nama_stasiun: string;
  meter_number?: string;
  phone_number?: string;
  provinsi?: string;
  kabupaten?: string;
  detail_lokasi?: string;
  keterangan?: string;
}

interface TrxData {
  ref_id: string;
  nama_stasiun: string;
  meter_number?: string;
  phone_number?: string;
  sku: string;
  price: number;
  status: string;
  token_sn?: string;
  wa_sent_at?: string | null;
  created_at: string;
  message?: string;
  raw_response?: any;
  provinsi?: string;
  kabupaten?: string;
  detail_lokasi?: string;
  keterangan?: string;
  asset_id: number;
}

interface StrukClientProps {
  dataPln: TrxData[];
  dataOrbit: TrxData[];
  assetsPln: AssetData[];
  assetsOrbit: AssetData[];
}

export function StrukClient({ dataPln, dataOrbit, assetsPln, assetsOrbit }: StrukClientProps) {
  const [activeTab, setActiveTab] = useState<"pln" | "orbit">("pln");
  const [localDataPln, setLocalDataPln] = useState<TrxData[]>(dataPln);
  const [localDataOrbit, setLocalDataOrbit] = useState<TrxData[]>(dataOrbit);
  const [localAssetsPln, setLocalAssetsPln] = useState<AssetData[]>(assetsPln || []);
  const [localAssetsOrbit, setLocalAssetsOrbit] = useState<AssetData[]>(assetsOrbit || []);

  useEffect(() => {
    setLocalDataPln(dataPln);
  }, [dataPln]);

  useEffect(() => {
    setLocalDataOrbit(dataOrbit);
  }, [dataOrbit]);

  useEffect(() => {
    setLocalAssetsPln(assetsPln || []);
  }, [assetsPln]);

  useEffect(() => {
    setLocalAssetsOrbit(assetsOrbit || []);
  }, [assetsOrbit]);

  const data = activeTab === "pln" ? localDataPln : localDataOrbit;
  const activeAssets = activeTab === "pln" ? localAssetsPln : localAssetsOrbit;

  const receiptRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [selectedTrx, setSelectedTrx] = useState<TrxData | null>(null);
  const [search, setSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState("all");
  const [keteranganInput, setKeteranganInput] = useState("");
  const [updatingKeterangan, setUpdatingKeterangan] = useState(false);
  const [printMode, setPrintMode] = useState<"all" | "table" | "receipts">("all");
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState<{ [key: number]: string }>({});
  const [pendingPrintType, setPendingPrintType] = useState<"table" | "receipts" | null>(null);
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    if (selectedTrx) {
      setKeteranganInput(selectedTrx.keterangan || "");
    } else {
      setKeteranganInput("");
    }
  }, [selectedTrx]);

  const availableMonths = Array.from(
    new Set(
      (activeTab === "pln" ? dataPln : dataOrbit).map((trx) => {
        const date = new Date(trx.created_at);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      })
    )
  ).sort().reverse();

  const formatMonthLabel = (monthYear: string) => {
    const [year, month] = monthYear.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleString("id-ID", { month: "long", year: "numeric" });
  };

  const baseTrxs = (() => {
    if (monthFilter === "all") {
      return data.map((trx) => {
        const asset = activeAssets.find((a) => a.id === trx.asset_id);
        return {
          ...trx,
          provinsi: asset?.provinsi || trx.provinsi,
          kabupaten: asset?.kabupaten || trx.kabupaten,
          detail_lokasi: asset?.detail_lokasi || trx.detail_lokasi,
          keterangan: asset?.keterangan !== undefined ? asset.keterangan : trx.keterangan,
        };
      });
    }

    const monthTrxs = data.filter((trx) => {
      const trxDate = new Date(trx.created_at);
      const trxMonthYear = `${trxDate.getFullYear()}-${String(trxDate.getMonth() + 1).padStart(2, "0")}`;
      return trxMonthYear === monthFilter;
    });

    const result: TrxData[] = [];
    activeAssets.forEach((asset) => {
      const trxForAsset = monthTrxs.filter((t) => t.asset_id === asset.id);
      if (trxForAsset.length > 0) {
        trxForAsset.forEach((t) => {
          result.push({
            ...t,
            provinsi: asset.provinsi || t.provinsi,
            kabupaten: asset.kabupaten || t.kabupaten,
            detail_lokasi: asset.detail_lokasi || t.detail_lokasi,
            keterangan: asset.keterangan !== undefined ? asset.keterangan : t.keterangan,
          });
        });
      } else {
        result.push({
          ref_id: `placeholder-${activeTab}-${asset.id}-${monthFilter}`,
          nama_stasiun: asset.nama_stasiun,
          meter_number: asset.meter_number || "",
          phone_number: asset.phone_number || "",
          sku: "",
          price: 0,
          status: "SUCCESS",
          token_sn: "-",
          created_at: `${monthFilter}-01T00:00:00.000Z`,
          provinsi: asset.provinsi || "",
          kabupaten: asset.kabupaten || "",
          detail_lokasi: asset.detail_lokasi || "",
          keterangan: asset.keterangan || "",
          asset_id: asset.id,
        });
      }
    });

    return result;
  })();

  const filteredData = baseTrxs
    .filter((trx) => {
      const idNum = trx.meter_number || trx.phone_number || "";
      const matchesSearch =
        trx.nama_stasiun.toLowerCase().includes(search.toLowerCase()) ||
        idNum.includes(search);
      return matchesSearch;
    })
    .sort((a, b) => a.nama_stasiun.localeCompare(b.nama_stasiun));

  const handleDownload = async () => {
    if (receiptRef.current === null) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(receiptRef.current, { 
        cacheBust: true,
        backgroundColor: "#ffffff",
        style: {
          borderRadius: "0px"
        }
      });
      const link = document.createElement("a");
      let fileName = 'Struk-transaksi.png';
      if (selectedTrx) {
        const date = new Date(selectedTrx.created_at);
        const monthName = date.toLocaleString('id-ID', { month: 'long' }).toLowerCase();
        const safeStasiun = selectedTrx.nama_stasiun.replace(/[\\/:*?"<>|]/g, '');
        fileName = `struk-${safeStasiun}-${monthName}-${selectedTrx.ref_id}.png`;
      }
      link.download = fileName;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Download failed", err);
    } finally {
      setDownloading(false);
    }
  };

  const handleUpdateKeterangan = async () => {
    if (!selectedTrx) return;
    setUpdatingKeterangan(true);
    try {
      const res = await fetch("/api/assets/update-keterangan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asset_id: selectedTrx.asset_id,
          type: activeTab,
          keterangan: keteranganInput
        })
      });
      const json = await res.json();
      if (!json.success) {
        alert("Gagal memperbarui keterangan: " + (json.error || "Unknown error"));
        return;
      }

      // Update local state to reflect the change immediately
      if (activeTab === "pln") {
        setLocalDataPln(prev => prev.map(t => 
          t.asset_id === selectedTrx.asset_id ? { ...t, keterangan: keteranganInput } : t
        ));
      } else {
        setLocalDataOrbit(prev => prev.map(t => 
          t.asset_id === selectedTrx.asset_id ? { ...t, keterangan: keteranganInput } : t
        ));
      }

      // Update selectedTrx too so the display updates
      setSelectedTrx(prev => prev ? { ...prev, keterangan: keteranganInput } : null);
      alert("Keterangan berhasil disimpan!");
    } catch (err: any) {
      alert("Terjadi kesalahan: " + err.message);
    } finally {
      setUpdatingKeterangan(false);
    }
  };

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const onTabChange = (val: string) => {
    setActiveTab(val as "pln" | "orbit");
    setSelectedTrx(null);
    setSearch("");
    setMonthFilter("all");
  };

  // Receipt Details Computation
  let tokenCode = "-";
  let customerName = "-";
  let segmentPower = "-";
  let kwh = "-";
  let rpToken = 0;
  let adminFee = 0;
  let totalBayar = 0;
  let idLabel = "IDPEL";
  let idValue = "-";

  if (activeTab === "pln") {
    if (selectedTrx?.token_sn && selectedTrx.token_sn.includes("/")) {
      const parts = selectedTrx.token_sn.split("/");
      tokenCode = parts[0]?.trim() || "-";
      customerName = parts[1]?.trim() || "-";
      
      let sp = parts[2]?.trim();
      if (sp && sp.includes("/")) {
        sp = sp.replace(/\//g, " / ");
      }
      segmentPower = sp || "-";
      kwh = parts[3]?.trim() || "-";
      if (kwh !== "-" && !isNaN(Number(kwh))) {
        kwh = Number(kwh).toString();
      }
    } else if (selectedTrx?.token_sn) {
      tokenCode = selectedTrx.token_sn.trim();
    }

    if (selectedTrx?.sku) {
      const numMatch = selectedTrx.sku.match(/\d+/);
      if (numMatch) {
        rpToken = parseInt(numMatch[0]) * 1000;
      } else {
        rpToken = selectedTrx.price || 0;
      }
    }

    adminFee = 3500;
    totalBayar = rpToken + adminFee;
    idLabel = "IDPEL";
    idValue = selectedTrx?.meter_number || "-";
  } else {
    // Orbit logic
    adminFee = 1000;
    rpToken = selectedTrx?.price || 0;
    totalBayar = 101000;
    idLabel = "NO CUSTOMER";
    idValue = selectedTrx?.phone_number || "-";
  }

  // Determine Voucher name for orbit based on SKU or static fallback
  let voucherName = "Telkomsel Data Orbit 20 GB 90 Hari";
  if (selectedTrx?.sku === "ORBIT10") voucherName = "Telkomsel Data Orbit 10 GB 7 Hari";
  if (selectedTrx?.sku === "ORBIT30") voucherName = "Telkomsel Data Orbit 30 GB 30 Hari";
  if (selectedTrx?.sku === "ORBIT50") voucherName = "Telkomsel Data Orbit 50 GB 30 Hari";
  if (selectedTrx?.sku === "ORBIT100") voucherName = "Telkomsel Data Orbit 100 GB 30 Hari";

  // Helper to compute receipt details for a given transaction (reusable for grid)
  const computeReceiptDetails = (trx: TrxData) => {
    let _tokenCode = "-";
    let _customerName = "-";
    let _segmentPower = "-";
    let _kwh = "-";
    let _rpToken = 0;
    let _adminFee = 0;
    let _totalBayar = 0;
    let _idLabel = "IDPEL";
    let _idValue = "-";

    if (activeTab === "pln") {
      if (trx.token_sn && trx.token_sn.includes("/")) {
        const parts = trx.token_sn.split("/");
        _tokenCode = parts[0]?.trim() || "-";
        _customerName = parts[1]?.trim() || "-";
        let sp = parts[2]?.trim();
        if (sp && sp.includes("/")) sp = sp.replace(/\//g, " / ");
        _segmentPower = sp || "-";
        _kwh = parts[3]?.trim() || "-";
        if (_kwh !== "-" && !isNaN(Number(_kwh))) _kwh = Number(_kwh).toString();
      } else if (trx.token_sn) {
        _tokenCode = trx.token_sn.trim();
      }
      if (trx.sku) {
        const numMatch = trx.sku.match(/\d+/);
        if (numMatch) _rpToken = parseInt(numMatch[0]) * 1000;
        else _rpToken = trx.price || 0;
      }
      _adminFee = 3500;
      _totalBayar = _rpToken + _adminFee;
      _idLabel = "IDPEL";
      _idValue = trx.meter_number || "-";
    } else {
      _adminFee = 1000;
      _rpToken = trx.price || 0;
      _totalBayar = 101000;
      _idLabel = "NO CUSTOMER";
      _idValue = trx.phone_number || "-";
    }
    return { tokenCode: _tokenCode, customerName: _customerName, segmentPower: _segmentPower, kwh: _kwh, rpToken: _rpToken, adminFee: _adminFee, totalBayar: _totalBayar, idLabel: _idLabel, idValue: _idValue };
  };

  const handleOpenReview = (type: "table" | "receipts") => {
    const initialNotes: { [key: number]: string } = {};
    filteredData.forEach((trx) => {
      initialNotes[trx.asset_id] = trx.keterangan || "";
    });
    setReviewNotes(initialNotes);
    setPendingPrintType(type);
    setIsReviewOpen(true);
  };

  const handleSaveAndPrint = async () => {
    setSavingNotes(true);
    try {
      const uniqueAssetIds = Array.from(new Set(filteredData.map((t) => t.asset_id)));
      
      for (const assetId of uniqueAssetIds) {
        const newNote = reviewNotes[assetId] ?? "";
        const currentTrx = filteredData.find((t) => t.asset_id === assetId);
        if (currentTrx && currentTrx.keterangan !== newNote) {
          const res = await fetch("/api/assets/update-keterangan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              asset_id: assetId,
              type: activeTab,
              keterangan: newNote,
            }),
          });
          const json = await res.json();
          if (!json.success) {
            console.error("Gagal update keterangan untuk asset_id:", assetId, json.error);
          }
        }
      }

      if (activeTab === "pln") {
        setLocalAssetsPln((prev) =>
          prev.map((a) => {
            const updatedNote = reviewNotes[a.id];
            return updatedNote !== undefined ? { ...a, keterangan: updatedNote } : a;
          })
        );
        setLocalDataPln((prev) =>
          prev.map((t) => {
            const updatedNote = reviewNotes[t.asset_id];
            return updatedNote !== undefined ? { ...t, keterangan: updatedNote } : t;
          })
        );
      } else {
        setLocalAssetsOrbit((prev) =>
          prev.map((a) => {
            const updatedNote = reviewNotes[a.id];
            return updatedNote !== undefined ? { ...a, keterangan: updatedNote } : a;
          })
        );
        setLocalDataOrbit((prev) =>
          prev.map((t) => {
            const updatedNote = reviewNotes[t.asset_id];
            return updatedNote !== undefined ? { ...t, keterangan: updatedNote } : t;
          })
        );
      }

      setIsReviewOpen(false);

      const category = activeTab === "pln" ? "PLN" : "Orbit";
      if (pendingPrintType === "table") {
        handlePrintWithTitle(
          "landscape",
          "table",
          category,
          monthFilter,
          () => setPrintMode("table"),
          () => setPrintMode("all")
        );
      } else if (pendingPrintType === "receipts") {
        handlePrintWithTitle(
          "portrait",
          "receipts",
          category,
          monthFilter,
          () => setPrintMode("receipts"),
          () => setPrintMode("all")
        );
      }
    } catch (err) {
      console.error("Gagal menyimpan keterangan", err);
      alert("Gagal menyimpan keterangan.");
    } finally {
      setSavingNotes(false);
    }
  };

  // Get the month label for the current filter
  const reportMonthLabel = monthFilter !== "all" ? formatMonthLabel(monthFilter) : "Semua Bulan";

  return (
    <div className="space-y-8 animate-slide-in-bottom pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 no-print">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 flex items-center gap-4">
            <div className="p-3 premium-gradient rounded-2xl shadow-xl shadow-blue-500/20">
              <Receipt className="h-8 w-8 text-white" />
            </div>
            <span className="text-gradient">Struk Transaksi</span>
          </h1>
          <p className="text-slate-500 mt-3 font-bold text-sm uppercase tracking-widest pl-1 border-l-4 border-blue-500 ml-1">
            Cetak Struk Pembelian
          </p>
        </div>
        <div className="flex gap-4">
          <Button
            onClick={() => handleOpenReview("table")}
            disabled={filteredData.length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 rounded-2xl h-14 px-6 font-black uppercase text-[11px] tracking-widest flex items-center gap-2 transition-all active:scale-95"
          >
            <Printer className="h-4 w-4" />
            Cetak Tabel (Landscape)
          </Button>
          <Button
            onClick={() => handleOpenReview("receipts")}
            disabled={filteredData.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 rounded-2xl h-14 px-6 font-black uppercase text-[11px] tracking-widest flex items-center gap-2 transition-all active:scale-95"
          >
            <Printer className="h-4 w-4" />
            Cetak Struk (Portrait)
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Left Side: Table & Filters (Hidden when printing) */}
        <div className="xl:col-span-8 space-y-6 no-print">
          
          <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
            <TabsList className="bg-slate-100/80 h-14 p-1.5 gap-2 rounded-[1.6rem] w-full sm:w-fit mb-4">
              <TabsTrigger 
                value="pln" 
                className="px-8 rounded-[1.2rem] h-full data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-lg transition-all duration-500 gap-3 font-black uppercase text-[10px] tracking-widest"
              >
                <Zap className="h-4 w-4" />
                Listrik Prabayar
              </TabsTrigger>
              <TabsTrigger 
                value="orbit" 
                className="px-8 rounded-[1.2rem] h-full data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-lg transition-all duration-500 gap-3 font-black uppercase text-[10px] tracking-widest"
              >
                <Wifi className="h-4 w-4" />
                Paket Data Orbit
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 group">
              <Input
                placeholder="Cari nama stasiun atau ID Pelanggan..."
                className="pl-14 h-14 bg-white border-slate-200 shadow-sm focus-visible:ring-4 focus-visible:ring-blue-500/5 text-base rounded-2xl transition-all font-bold"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <div className="w-full md:w-[240px]">
              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger className="h-14 rounded-2xl bg-white border-slate-200 shadow-sm px-6 font-bold text-slate-600 focus:ring-4 focus:ring-blue-500/5">
                  <div className="flex items-center gap-3">
                    <Filter className="h-4 w-4 text-slate-400" />
                    <SelectValue placeholder="Pilih Bulan" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl p-2 bg-white">
                  <SelectItem value="all" className="rounded-xl font-bold text-slate-600 focus:bg-blue-50 focus:text-blue-600 py-3">Semua Bulan</SelectItem>
                  {availableMonths.map((m) => (
                    <SelectItem key={m} value={m} className="rounded-xl font-bold text-slate-600 focus:bg-blue-50 focus:text-blue-600 py-3">
                      {formatMonthLabel(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="max-h-[600px] overflow-auto no-scrollbar relative">
              <Table>
                <TableHeader className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="py-4 pl-6 font-black uppercase tracking-widest text-[10px] text-slate-400">Tanggal</TableHead>
                    <TableHead className="font-black uppercase tracking-widest text-[10px] text-slate-400">Stasiun</TableHead>
                    <TableHead className="font-black uppercase tracking-widest text-[10px] text-slate-400">
                      {activeTab === "pln" ? "ID Pelanggan" : "No HP Orbit"}
                    </TableHead>
                    <TableHead className="font-black uppercase tracking-widest text-[10px] text-slate-400 text-right pr-6">Nominal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-10">
                        <span className="text-sm font-bold text-slate-400">Data Tidak Ditemukan</span>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredData.map((trx) => (
                      <TableRow 
                        key={trx.ref_id} 
                        className={cn(
                          "cursor-pointer hover:bg-blue-50/50 transition-colors",
                          selectedTrx?.ref_id === trx.ref_id && "bg-blue-50"
                        )}
                        onClick={() => setSelectedTrx(trx)}
                      >
                        <TableCell className="py-4 pl-6">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-bold text-slate-700">
                              {new Date(trx.created_at).toLocaleDateString("id-ID", { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                            <span className="text-[10px] text-slate-400">{new Date(trx.created_at).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })} WIB</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-bold text-slate-700">{trx.nama_stasiun}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-mono text-slate-600">{trx.meter_number || trx.phone_number || "-"}</span>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <span className="text-sm font-bold text-emerald-600">Rp {trx.price.toLocaleString("id-ID")}</span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* Right Side: Receipt Preview */}
        <div className="xl:col-span-4 flex flex-col items-center xl:items-end">
          <div className="w-full max-w-[380px] print:max-w-full">
            <div className="bg-slate-100 rounded-3xl p-6 border border-slate-200 shadow-sm print:bg-white print:p-0 print:border-none print:shadow-none mb-6 no-print">
              <Button 
                onClick={handleDownload} 
                disabled={!selectedTrx || downloading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-6 font-bold shadow-lg shadow-blue-600/20"
              >
                {downloading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Download className="w-5 h-5 mr-2" />}
                Download Struk
              </Button>
            </div>

            {selectedTrx ? (
              <div ref={receiptRef} className="bg-white p-6 shadow-sm border border-slate-200 print:w-full print:shadow-none print:border-none font-mono text-[13px] leading-relaxed text-slate-900 print:text-black">
                <div className="text-center mb-4">
                  <div className="text-l font-bold">** Ebiznet Multipayment **</div>
                  <div className="mt-1">
                    {new Date(selectedTrx.created_at).toLocaleString("id-ID", {
                      day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit"
                    }).replace(/\./g, ":").replace(", ", " ")}
                  </div>
                  <div className="mt-2">
                    {activeTab === "pln" ? "STRUK PEMBELIAN LISTRIK PRABAYAR" : "STRUK PEMBELIAN PULSA / PAKET DATA"}
                  </div>
                </div>

                <div className="mt-6 space-y-1">
                  {activeTab === "pln" && (
                    <div className="flex">
                      <span className="w-[110px] shrink-0">NO METER</span>
                      <span className="mr-2">:</span>
                      <span className="break-all">{selectedTrx.meter_number || "-"}</span>
                    </div>
                  )}
                  <div className="flex">
                    <span className="w-[110px] shrink-0">{idLabel}</span>
                    <span className="mr-2">:</span>
                    <span className="break-all">{idValue}</span>
                  </div>
                  {activeTab === "pln" && (
                    <>
                      <div className="flex">
                        <span className="w-[110px] shrink-0">NAMA</span>
                        <span className="mr-2">:</span>
                        <span className="break-all">{customerName}</span>
                      </div>
                      <div className="flex">
                        <span className="w-[110px] shrink-0">TARIF/DAYA</span>
                        <span className="mr-2">:</span>
                        <span className="break-all">{segmentPower}</span>
                      </div>
                    </>
                  )}
                  {activeTab === "orbit" && (
                    <div className="flex">
                      <span className="w-[110px] shrink-0">VOUCHER</span>
                      <span className="mr-2">:</span>
                      <span className="break-words">{voucherName}</span>
                    </div>
                  )}
                  <div className="flex">
                    <span className="w-[110px] shrink-0">NO REF</span>
                    <span className="mr-2">:</span>
                    <span className="break-all">{selectedTrx.ref_id}</span>
                  </div>
                  {activeTab === "orbit" && (
                    <div className="flex">
                      <span className="w-[110px] shrink-0">STATUS</span>
                      <span className="mr-2">:</span>
                      <span className="break-all">{selectedTrx.status === "SUCCESS" ? "BERHASIL" : selectedTrx.status}</span>
                    </div>
                  )}
                </div>

                {activeTab === "pln" && (
                  <>
                    <div className="mt-4 space-y-1">
                      <div className="flex">
                        <span className="w-[110px] shrink-0">METERAI</span>
                        <span className="mr-2">:</span>
                        <span>Rp</span>
                        <span className="flex-1 text-right">0</span>
                      </div>
                      <div className="flex">
                        <span className="w-[110px] shrink-0">PPN</span>
                        <span className="mr-2">:</span>
                        <span>Rp</span>
                        <span className="flex-1 text-right">0</span>
                      </div>
                      <div className="flex">
                        <span className="w-[110px] shrink-0">PBJT-TL</span>
                        <span className="mr-2">:</span>
                        <span>Rp</span>
                        <span className="flex-1 text-right">0</span>
                      </div>
                      <div className="flex">
                        <span className="w-[110px] shrink-0">ANGSURAN</span>
                        <span className="mr-2">:</span>
                        <span>Rp</span>
                        <span className="flex-1 text-right">0</span>
                      </div>
                      <div className="flex">
                        <span className="w-[110px] shrink-0">RP TOKEN</span>
                        <span className="mr-2">:</span>
                        <span>Rp</span>
                        <span className="flex-1 text-right">{formatRupiah(rpToken)}</span>
                      </div>
                      <div className="flex">
                        <span className="w-[110px] shrink-0">JUMLAH KWH</span>
                        <span className="mr-2">:</span>
                        <span>{kwh !== "-" ? `${kwh} kWh` : "-"}</span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div>STROOM/TOKEN :</div>
                      <div className="font-bold text-base text-center mt-2 tracking-widest break-all">
                        {tokenCode.replace(/(.{4})/g, "$1 ").trim()}
                      </div>
                    </div>
                  </>
                )}

                <div className="mt-6 space-y-1">
                  <div className="flex">
                    <span className="w-[110px] shrink-0">ADMIN BANK</span>
                    <span className="mr-2">:</span>
                    <span>Rp</span>
                    <span className="flex-1 text-right">{formatRupiah(adminFee)}</span>
                  </div>
                  <div className="flex font-bold">
                    <span className="w-[110px] shrink-0">TOTAL BAYAR</span>
                    <span className="mr-2">:</span>
                    <span>Rp</span>
                    <span className="flex-1 text-right">{formatRupiah(totalBayar)}</span>
                  </div>
                </div>

                <div className="mt-8 text-center space-y-1">
                  <div>TERIMA KASIH</div>
                  {activeTab === "pln" ? (
                    <>
                      <div>Informasi Hubungi Call Center</div>
                      <div>123 Atau hubungi PLN Terdekat</div>
                      <div>Download PLN Mobile</div>
                    </>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="bg-white p-6 shadow-sm border border-slate-200 text-center text-slate-400 py-20 font-bold no-print rounded-3xl">
                Pilih transaksi dari tabel untuk melihat struk
              </div>
            )}

            {selectedTrx && (
              <div className="mt-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm no-print space-y-4">
                <h4 className="font-extrabold text-sm text-slate-700 flex items-center gap-2">
                  <Edit3 className="h-4 w-4 text-blue-500" />
                  Keterangan Stasiun / Asset
                </h4>
                <div className="space-y-3">
                  <Input 
                    type="text" 
                    placeholder="Masukkan keterangan stasiun..." 
                    value={keteranganInput}
                    onChange={(e) => setKeteranganInput(e.target.value)}
                    className="h-12 rounded-xl font-medium border-slate-200 focus-visible:ring-blue-500/10 focus-visible:ring-4"
                  />
                  <Button 
                    onClick={handleUpdateKeterangan} 
                    disabled={updatingKeterangan}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white rounded-xl py-4 font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    {updatingKeterangan ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Simpan Keterangan
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Review Dialog */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-6 rounded-3xl bg-white border border-slate-200 shadow-2xl">
          <DialogHeader className="border-b border-slate-100 pb-4">
            <DialogTitle className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <Printer className="h-6 w-6 text-blue-500" />
              Review Keterangan & Cetak
            </DialogTitle>
            <p className="text-sm text-slate-500 font-medium">
              Review dan lengkapi keterangan stasiun untuk periode ini sebelum melanjutkan cetak.
            </p>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4 space-y-4 no-scrollbar">
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="w-[80px] font-black uppercase text-[10px] text-slate-400 py-3 pl-6">No</TableHead>
                    <TableHead className="w-[180px] font-black uppercase text-[10px] text-slate-400">ID Stasiun</TableHead>
                    <TableHead className="w-[180px] font-black uppercase text-[10px] text-slate-400">Status Transaksi</TableHead>
                    <TableHead className="font-black uppercase text-[10px] text-slate-400 pr-6">Keterangan / Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((trx, idx) => {
                    const isPlaceholder = trx.ref_id.startsWith("placeholder-");
                    return (
                      <TableRow key={trx.ref_id} className="hover:bg-slate-50/50">
                        <TableCell className="font-bold text-slate-500 py-3 pl-6">{idx + 1}</TableCell>
                        <TableCell className="font-extrabold text-slate-800">{trx.nama_stasiun}</TableCell>
                        <TableCell>
                          {isPlaceholder ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              Tidak Ada Transaksi
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Ada Transaksi (Rp {trx.price.toLocaleString("id-ID")})
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="pr-6">
                          <Input
                            type="text"
                            placeholder="Input keterangan..."
                            value={reviewNotes[trx.asset_id] ?? ""}
                            onChange={(e) =>
                              setReviewNotes((prev) => ({
                                ...prev,
                                [trx.asset_id]: e.target.value,
                              }))
                            }
                            className="h-10 rounded-xl border-slate-200 focus-visible:ring-blue-500/10 focus-visible:ring-4 font-medium"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          <DialogFooter className="border-t border-slate-100 pt-4 flex gap-3">
            <Button
              variant="outline"
              onClick={() => setIsReviewOpen(false)}
              className="rounded-xl px-6 h-12 font-bold text-slate-500 border-slate-200 hover:bg-slate-50"
            >
              Batal
            </Button>
            <Button
              onClick={handleSaveAndPrint}
              disabled={savingNotes}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 h-12 font-bold shadow-lg shadow-blue-600/20 flex items-center gap-2"
            >
              {savingNotes ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Printer className="h-4 w-4" />
                  Simpan & Cetak
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ====== PRINT-ONLY: Full Report Layout ====== */}
      <div className={cn(
        "print-report-container",
        printMode === "table" && "print-mode-table",
        printMode === "receipts" && "print-mode-receipts"
      )}>
        <ReportSummaryTable
          filteredData={filteredData}
          activeTab={activeTab}
          reportMonthLabel={reportMonthLabel}
          formatRupiah={formatRupiah}
          computeReceiptDetails={computeReceiptDetails}
        />

        <ReceiptGrid
          filteredData={filteredData}
          activeTab={activeTab}
          reportMonthLabel={reportMonthLabel}
          formatRupiah={formatRupiah}
          computeReceiptDetails={computeReceiptDetails}
          voucherNameMap={(sku) => {
            let voucherName = "Telkomsel Data Orbit 20 GB 90 Hari";
            if (sku === "ORBIT10") voucherName = "Telkomsel Data Orbit 10 GB 7 Hari";
            if (sku === "ORBIT30") voucherName = "Telkomsel Data Orbit 30 GB 30 Hari";
            if (sku === "ORBIT50") voucherName = "Telkomsel Data Orbit 50 GB 30 Hari";
            if (sku === "ORBIT100") voucherName = "Telkomsel Data Orbit 100 GB 30 Hari";
            return voucherName;
          }}
        />
      </div>
      
      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        /* === SCREEN: hide print-only elements === */
        .print-report-container {
          display: none;
        }

        /* Page settings outside @media print for Chromium named page support */
        @page {
          size: A4 portrait;
          margin: 10mm 10mm;
        }

        @page landscape-sheet {
          size: A4 landscape;
          margin: 10mm 10mm;
        }

        .report-summary-page {
          page: landscape-sheet;
        }

        @media print {
          /* Reset Next.js layout wrappers to allow chromium named page sizes (landscape/portrait mix) */
          html, body, main, main > div, div.flex, div.flex-1 {
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            overflow: visible !important;
            position: static !important;
            display: block !important;
            width: 100% !important;
          }

          /* Hide everything on screen by default */
          body * {
            visibility: hidden;
          }

          /* Hide the screen-only UI */
          .no-print {
            display: none !important;
          }

          /* Show the report container */
          .print-report-container,
          .print-report-container * {
            visibility: visible !important;
            display: revert;
          }

          .print-report-container {
            display: block !important;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
          }

          .report-summary-page {
            page-break-after: always;
            break-after: page;
          }

          /* Hide receipts when printMode is table */
          .print-mode-table .report-receipts-page {
            display: none !important;
          }

          /* Hide table when printMode is receipts */
          .print-mode-receipts .report-summary-page {
            display: none !important;
          }

          /* Report pages */
          .report-page {
            page-break-after: always;
            break-after: page;
            padding: 0;
          }

          .report-page:last-child {
            page-break-after: auto;
            break-after: auto;
          }

          /* Page header shown at top of every receipt page */
          .receipt-page-header {
            text-align: center;
            margin-bottom: 10px;
            padding-bottom: 6px;
            border-bottom: 1.5px solid #334155;
            font-family: 'Segoe UI', Arial, sans-serif;
          }

          /* Summary table */
          .report-summary-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
            font-family: 'Segoe UI', Arial, sans-serif;
          }

          .report-summary-table th {
            background: none;
            border: 1px solid #475569;
            padding: 6px 8px;
            text-align: left;
            font-weight: 800;
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 0.03em;
            white-space: nowrap;
          }

          .report-summary-table td {
            border: 1px solid #94a3b8;
            padding: 5px 8px;
            font-size: 10px;
          }

          .report-summary-table tfoot td {
            border-top: 2px solid #334155;
            font-size: 11px;
            padding: 8px;
          }

          /* Receipt grid — base: 3 columns */
          .receipt-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            align-items: stretch;
          }

          /* PLN: 3×2 = 6 per page */
          .receipt-grid-2row {
            grid-template-rows: repeat(2, 1fr);
          }

          /* Orbit: 3×4 = 12 per page */
          .receipt-grid-4row {
            grid-template-rows: repeat(4, 1fr);
          }

          .receipt-grid-item {
            break-inside: avoid;
            page-break-inside: avoid;
            text-align: center;
            display: flex;
            flex-direction: column;
          }

          .receipt-card {
            border: 1px solid #64748b;
            padding: 8px 10px;
            font-family: 'Courier New', Courier, monospace;
            font-size: 9px;
            line-height: 1.4;
            text-align: left;
            background: transparent;
            /* Stretch card to fill row height equally */
            flex: 1;
            display: flex;
            flex-direction: column;
          }

          .receipt-station-label {
            font-size: 10px;
            font-weight: 800;
            text-align: center;
            margin-top: 3px;
            padding: 3px 6px;
            background: transparent;
            border: 1px solid #64748b;
            text-transform: uppercase;
            letter-spacing: 0.03em;
          }

          .receipt-info {
            line-height: 1.5;
          }

          .receipt-row {
            display: flex;
            font-size: 9px;
          }

          .receipt-label {
            width: 75px;
            flex-shrink: 0;
            font-size: 9px;
          }

          .receipt-value {
            margin-left: 4px;
            word-break: break-all;
          }

          .receipt-amount {
            flex: 1;
            text-align: right;
          }

          /* Each receipt page breaks after itself */
          .report-receipts-page {
            page-break-after: always;
            break-after: page;
          }

          .report-receipts-page:last-child {
            page-break-after: auto;
            break-after: auto;
          }
        }
      `}} />
    </div>
  );
}
