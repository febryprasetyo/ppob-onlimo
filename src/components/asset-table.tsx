"use client";

import { useState, useRef, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  Zap, 
  Wifi, 
  CheckCircle2, 
  XCircle, 
  Copy, 
  Loader2, 
  Info, 
  Bug, 
  ChevronDown, 
  ChevronUp,
  Ticket,
  Clock,
  AlertTriangle,
  RefreshCw,
  Download,
  Image as ImageIcon,
  Eye
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toPng } from "html-to-image";

interface Asset {
  id: number;
  nama_stasiun: string;
  meter_number?: string;
  phone_number?: string;
  operator_wa: string;
  default_sku?: string | null;
  last_trx_status?: string | null;
  last_trx_at?: string | null;
}

interface AssetTableProps {
  assets: Asset[];
  type: "PLN" | "ORBIT";
}

export function AssetTable({ assets, type }: AssetTableProps) {
  // ... existing state ...
  
  // (Include existing state here in ReplacementContent to ensure correctly replaced)
  const [loading, setLoading] = useState<number | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [openDialog, setOpenDialog] = useState<number | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  
  const receiptRef = useRef<HTMLDivElement>(null);
  
  // Stats for result modal
  const [resultModal, setResultModal] = useState<{
    open: boolean;
    status: "success" | "pending" | "failed";
    title: string;
    message: string;
    sn?: string;
    ref_id?: string;
    price?: number;
    raw_response?: any;
    station_name?: string;
    customer_no?: string;
  }>({
    open: false,
    status: "success",
    title: "",
    message: "",
  });

  const handleAction = async (assetId: number, sku: string, asset: Asset) => {
    setLoading(assetId);
    setShowDebug(false);
    const endpoint = type === "PLN" ? "/api/trx/pln" : "/api/trx/orbit";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asset_id: assetId, sku }),
      });
      const json = await res.json();
      
      if (json.success) {
        setOpenDialog(null);
        handleTransactionResponse(json, asset.nama_stasiun, type === "PLN" ? asset.meter_number : asset.phone_number);
      } else {
        setResultModal({
          open: true,
          status: "failed",
          title: "Gagal Mengirim",
          message: json.error || "Terjadi kesalahan saat menghubungi server.",
          raw_response: json,
          station_name: asset.nama_stasiun
        });
      }
    } catch (error) {
      setResultModal({
        open: true,
        status: "failed",
        title: "Kesalahan Koneksi",
        message: "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.",
      });
    } finally {
      setLoading(null);
    }
  };

  // ... (rest of helper functions) ...

  const handleTransactionResponse = (json: any, stationName: string, customerNo?: string) => {
    const data = json.data || {};
    let status: "success" | "pending" | "failed" = "failed";
    let title = "Transaksi Gagal";
    
    // Check by RC first (Prioritas)
    if (data.rc === "00") {
      status = "success";
      title = "Transaksi Berhasil";
    } else if (data.rc === "03") {
      status = "pending";
      title = "Transaksi Diproses";
    } 
    // Fallback ke string status jika RC tidak ada (antisipasi simulasi)
    else if (data.status === "Sukses" || data.status === "Success") {
      status = "success";
      title = "Transaksi Berhasil";
    } else if (data.status === "Pending") {
      status = "pending";
      title = "Transaksi Diproses";
    }
    
    setResultModal({
      open: true,
      status: status,
      title: title,
      message: data.message || (status === "success" ? "Token berhasil diterbitkan." : "Tunggu sebentar, provider sedang memproses."),
      sn: data.sn,
      ref_id: json.ref_id,
      price: data.price,
      raw_response: json,
      station_name: stationName,
      customer_no: customerNo
    });
  };

  // Auto-check effect when modal is open and status is pending
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (resultModal.open && resultModal.status === "pending" && resultModal.ref_id) {
      interval = setInterval(() => {
        handleCheckStatus();
      }, 5000); // Check every 5 seconds
    }

    return () => clearInterval(interval);
  }, [resultModal.open, resultModal.status, resultModal.ref_id]);

  const handleCheckStatus = async () => {
    if (!resultModal.ref_id) return;
    setCheckingStatus(true);
    try {
      const res = await fetch(`/api/trx/check-status?ref_id=${resultModal.ref_id}&type=${type}`);
      const json = await res.json();
      if (json.success) {
        // If status changed from pending, update the modal
        const data = json.data || {};
        let newStatus = resultModal.status;

        if (data.rc === "00" || data.status === "Sukses" || data.status === "Success") {
            newStatus = "success";
        } else if (data.rc === "03" || data.status === "Pending") {
            newStatus = "pending";
        } else {
            newStatus = "failed";
        }

        if (newStatus !== resultModal.status) {
             handleTransactionResponse(json, resultModal.station_name || "", resultModal.customer_no);
        }
      }
    } catch (error) {
      console.error("Check status failed", error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleViewLastStatus = async (asset: Asset) => {
      setLoading(asset.id);
      try {
          const res = await fetch(`/api/trx/check-status?type=${type}&asset_id=${asset.id}`);
          const json = await res.json();
          
          if (json.success) {
               handleTransactionResponse(json, asset.nama_stasiun, type === "PLN" ? asset.meter_number : asset.phone_number);
          } else {
               if (res.status === 404) {
                   alert("Belum ada riwayat transaksi untuk stasiun ini.");
               } else {
                   alert(json.error || "Gagal memuat data transaksi.");
               }
          }
      } catch (e) {
          console.error("View Status Error", e);
      } finally {
          setLoading(null);
      }
  }

  const downloadReceipt = async () => {
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
      link.download = `Struk-${resultModal.ref_id || 'transaksi'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Download failed", err);
    } finally {
      setDownloading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const plnProducts = [
    { name: "PLN 20.000", sku: "pln20" },
    { name: "PLN 50.000", sku: "pln50" },
    { name: "PLN 100.000", sku: "pln100" },
    { name: "PLN 200.000", sku: "pln200" },
  ];

  const orbitProducts = [
    { name: "Orbit 20GB", sku: "orbit20" },
  ];

  const products = type === "PLN" ? plnProducts : orbitProducts;

  const getModalTheme = () => {
    switch (resultModal.status) {
      case "success": return { bg: "bg-emerald-600", lightBg: "bg-emerald-50", text: "text-emerald-800", icon: <CheckCircle2 className="h-10 w-10 text-emerald-600" />, shadow: "shadow-emerald-200", btn: "bg-emerald-500 hover:bg-emerald-600" };
      case "pending": return { bg: "bg-amber-500", lightBg: "bg-amber-50", text: "text-amber-800", icon: <Clock className="h-10 w-10 text-amber-500 animate-pulse" />, shadow: "shadow-amber-200", btn: "bg-amber-500 hover:bg-amber-600" };
      case "failed": return { bg: "bg-rose-600", lightBg: "bg-rose-50", text: "text-rose-800", icon: <XCircle className="h-10 w-10 text-rose-600" />, shadow: "shadow-rose-200", btn: "bg-rose-500 hover:bg-rose-600" };
      default: return { bg: "bg-slate-600", lightBg: "bg-slate-50", text: "text-slate-800", icon: <Info className="h-10 w-10 text-slate-600" />, shadow: "shadow-slate-200", btn: "bg-slate-500 hover:bg-slate-600" };
    }
  };

  const theme = getModalTheme();

  return (
    <div className="rounded-[2rem] border-none bg-white overflow-hidden shadow-2xl shadow-slate-200/50">
      <div className="overflow-x-auto no-scrollbar">
        <Table>
          <TableHeader className="bg-slate-50/80 border-b border-slate-100">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[80px] font-black uppercase tracking-widest text-[10px] text-slate-400 py-6 pl-10">ID</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px] text-slate-400">Nama Stasiun / Lokasi</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px] text-slate-400">{type === "PLN" ? "No. Meter / ID PLN" : "No. Orbit / Internet"}</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px] text-slate-400 text-center">Status Transaksi</TableHead>
              <TableHead className="text-right font-black uppercase tracking-widest text-[10px] text-slate-400 pr-10">KONTROL AKSI</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assets.length > 0 ? (
              assets.map((asset) => (
                <TableRow key={asset.id} className="group hover:bg-blue-50/30 transition-all border-slate-50 last:border-0">
                  <TableCell className="font-black text-slate-400 pl-10">#{asset.id}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-black text-slate-800 tracking-tight text-base group-hover:text-blue-600 transition-colors uppercase leading-none">{asset.nama_stasiun}</span>
                      <div className="flex items-center gap-1.5 mt-2">
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-slate-100/50 text-slate-500 border-slate-200 font-black h-4 uppercase tracking-tighter">Station Unit</Badge>
                        {/* <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-60 flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" /> {asset.operator_wa}</span> */}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-9 w-9 rounded-xl flex items-center justify-center shadow-sm",
                        type === "PLN" ? "bg-yellow-50 text-yellow-500 border border-yellow-100" : "bg-blue-50 text-blue-500 border border-blue-100"
                      )}>
                        {type === "PLN" ? <Zap className="h-4 w-4" /> : <Wifi className="h-4 w-4" />}
                      </div>
                      <code className="font-black text-slate-700 tracking-[0.1em] text-sm group-hover:bg-slate-900 group-hover:text-white px-2 py-1 rounded-lg transition-all">
                        {type === "PLN" ? asset.meter_number : asset.phone_number}
                      </code>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className={cn(
                      "inline-flex items-center px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] border transition-all shadow-sm",
                      !asset.last_trx_status || asset.last_trx_status === null 
                        ? "bg-slate-50 text-slate-300 border-slate-100"
                        : asset.last_trx_status === "SUCCESS"
                        ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                        : asset.last_trx_status === "PENDING"
                        ? "bg-amber-50 text-amber-600 border-amber-100"
                        : "bg-rose-50 text-rose-600 border-rose-100"
                    )}>
                      {!asset.last_trx_status ? "UNINITIALIZED" : asset.last_trx_status}
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-10">
                    <div className="flex justify-end gap-2">
                      {type === "PLN" && asset.last_trx_status && (
                          <Button
                            variant="ghost"
                            className="rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] active:scale-95 h-12 flex gap-2 px-4 bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all border border-slate-100 shadow-sm"
                            onClick={() => handleViewLastStatus(asset)}
                            disabled={loading === asset.id}
                          >
                             {loading === asset.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                             Status
                          </Button>
                      )}
                      <Dialog open={openDialog === asset.id} onOpenChange={(open) => setOpenDialog(open ? asset.id : null)}>
                        <DialogTrigger asChild>
                          <Button 
                            className={cn(
                              "rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg transition-all active:scale-95 h-12 flex gap-3 px-8",
                              type === "PLN" 
                                ? "bg-slate-900 hover:bg-black text-white shadow-slate-200" 
                                : "premium-gradient text-white shadow-blue-500/20"
                            )}
                          >
                            {loading === asset.id ? <Loader2 className="h-4 w-4 animate-spin" /> : (type === "PLN" ? <Zap className="h-4 w-4" /> : <Wifi className="h-4 w-4" />)}
                            {type === "PLN" ? "Topup Token" : "Topup Orbit"}
                          </Button>
                        </DialogTrigger>
                      <DialogContent className="sm:max-w-[480px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
                        <div className={cn(
                          "p-8 pb-12 text-white",
                          type === "PLN" ? "bg-yellow-500" : "bg-blue-600"
                        )}>
                          <DialogHeader>
                            <DialogTitle className="text-3xl font-black tracking-tight flex items-center gap-3">
                              {type === "PLN" ? <Zap className="h-8 w-8" /> : <Wifi className="h-8 w-8" />}
                              Pilih Produk
                            </DialogTitle>
                            <DialogDescription className="text-white/80 font-bold text-sm mt-2">
                              Pilih nominal pengisian untuk <span className="bg-white/20 px-2 py-0.5 rounded text-white">{asset.nama_stasiun}</span>
                            </DialogDescription>
                          </DialogHeader>
                        </div>
                        
                        <div className="p-8 -mt-8 bg-white rounded-t-[2.5rem] space-y-4">
                          <div className="grid gap-4">
                            {products.map((p) => (
                              <Button
                                key={p.sku}
                                variant="outline"
                                className="h-20 text-base justify-between px-8 rounded-[1.5rem] hover:bg-slate-50 border-slate-100 transition-all font-black group shadow-sm hover:shadow-md hover:border-blue-200"
                                onClick={() => handleAction(asset.id, p.sku, asset)}
                                disabled={loading === asset.id}
                              >
                                <div className="flex items-center gap-4">
                                  <div className={cn(
                                    "p-3 rounded-2xl transition-all shadow-inner",
                                    type === "PLN" ? "bg-yellow-50 text-yellow-500 group-hover:bg-yellow-500 group-hover:text-white" : "bg-blue-50 text-blue-500 group-hover:bg-blue-600 group-hover:text-white"
                                  )}>
                                    {type === "PLN" ? <Zap className="h-5 w-5" /> : <Wifi className="h-5 w-5" />}
                                  </div>
                                  <div className="flex flex-col items-start translate-y-[-1px]">
                                    <span className="text-lg text-slate-800">{p.name}</span>
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Provider SKU: {p.sku}</span>
                                  </div>
                                </div>
                                {loading === asset.id ? (
                                  <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                                ) : (
                                  <div className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-50 group-hover:bg-blue-50 transition-colors">
                                    <ChevronDown className="h-5 w-5 text-slate-300 group-hover:text-blue-500 -rotate-90" />
                                  </div>
                                )}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-3 text-slate-300">
                    {/* <Database className="h-12 w-12 opacity-20" /> */}
                    <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Belum ada stasiun terdaftar</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* RESULT MODAL (STRUK TOKEN UI) */}
      <Dialog 
        open={resultModal.open} 
        onOpenChange={(open) => {
          setResultModal(prev => ({ ...prev, open }));
          if (!open) {
            window.location.reload();
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px] rounded-[3rem] p-0 overflow-hidden border-none shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] max-h-[92vh] flex flex-col scale-100 animate-in zoom-in-95 duration-500">
          <div className="flex-1 overflow-y-auto no-scrollbar bg-slate-50">
            <div id="receipt-container" ref={receiptRef} className="bg-white flex flex-col w-full px-2 pt-2">
              <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-100 flex flex-col">
                {/* Header Card */}
                <div className={cn(
                  "p-10 text-center relative overflow-hidden transition-colors duration-700",
                  theme.bg
                )}>
                  <div className="absolute top-0 right-0 p-4 opacity-5 translate-x-1/4 translate-y-[-1/4]">
                    {type === "PLN" ? <Zap className="h-48 w-48 text-white" /> : <Wifi className="h-48 w-48 text-white" />}
                  </div>
                  
                  <div className="flex justify-center mb-6 relative z-10">
                    <div className="bg-white p-5 rounded-[2rem] shadow-2xl animate-in zoom-in duration-700">
                      {theme.icon}
                    </div>
                  </div>
                  <h2 className="text-3xl font-black text-white relative z-10 uppercase tracking-tighter leading-none">{resultModal.title}</h2>
                  <p className="text-white/60 font-bold text-xs mt-3 relative z-10 uppercase tracking-[0.2em]">{resultModal.station_name}</p>
                </div>

                <div className="bg-white p-8 space-y-8 relative">
                  {/* Token Display (Main Attention) */}
                  {type === "PLN" && (
                    <div className={cn(
                      "rounded-[2rem] p-8 space-y-4 text-center transition-all duration-500 border-2",
                      resultModal.status === "pending" ? "bg-amber-50/50 border-amber-200/50" : "bg-slate-50/50 border-slate-100"
                    )}>
                      <div className="flex items-center justify-center gap-2">
                        <Ticket className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Nomor Token Listrik</span>
                      </div>
                      
                      {(() => {
                        let tokenCode = resultModal.sn || "-";
                        if (resultModal.status === "success" && resultModal.sn && resultModal.sn.includes("/")) {
                            tokenCode = resultModal.sn.split("/")[0].trim();
                        }

                        return (
                          <div className="relative group/token">
                            <div className="bg-white rounded-[1.5rem] py-8 px-4 border border-slate-200 shadow-xl shadow-slate-200/50 min-h-[100px] flex items-center justify-center cursor-pointer transition-all hover:scale-[1.02]" onClick={() => tokenCode !== "-" && copyToClipboard(tokenCode)}>
                              {resultModal.status === "success" && tokenCode ? (
                                <span className="text-4xl font-black text-slate-900 tracking-[0.25em] font-mono break-all animate-in fade-in slide-in-from-bottom-2 duration-700">
                                  {tokenCode}
                                </span>
                              ) : resultModal.status === "pending" ? (
                                <div className="flex flex-col items-center gap-3">
                                  <RefreshCw className="h-8 w-8 text-amber-500 animate-spin" />
                                  <span className="text-xs font-black tracking-widest uppercase text-amber-600">Sinkronisasi Provider...</span>
                                </div>
                              ) : (
                                <span className="text-rose-500 font-black uppercase tracking-widest text-sm flex items-center gap-2">
                                  <AlertTriangle className="h-5 w-5" /> Gagal Mendapatkan PIN Token
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })()}

                      <p className="text-[10px] text-slate-400 font-bold leading-relaxed px-4">
                        {resultModal.status === "pending" 
                          ? "* Database sedang menunggu konfirmasi token dari provider Digiflazz." 
                          : resultModal.status === "success" 
                          ? "* Masukkan 20 digit kode token di atas ke meteran listrik di lokasi stasiun."
                          : "* Permintaan dibatalkan karena timeout atau kesalahan sistem."}
                      </p>
                    </div>
                  )}

                  {/* Detail Grid */}
                  <div className="space-y-4 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
                    
                    {/* Parsed Details for PLN */}
                    {(() => {
                        if (type === "PLN" && resultModal.status === "success" && resultModal.sn && resultModal.sn.includes("/")) {
                            const parts = resultModal.sn.split("/");
                            const customerName = parts[1]?.trim();
                            let segmentPower = parts[2]?.trim();
                            if (segmentPower && segmentPower.includes("/")) {
                                segmentPower = segmentPower.replace(/\//g, " / ");
                            }
                            const kwh = parts[3]?.trim();

                            return (
                                <>
                                    {customerName && (
                                        <div className="flex justify-between items-center px-2">
                                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Nama Pelanggan</span>
                                            <span className="text-sm font-black text-slate-700 tracking-wider text-right w-[60%] truncate">{customerName}</span>
                                        </div>
                                    )}
                                    {segmentPower && (
                                        <div className="flex justify-between items-center px-2">
                                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Tarif / Daya</span>
                                            <span className="text-sm font-black text-slate-700 tracking-wider text-right">{segmentPower}</span>
                                        </div>
                                    )}
                                    {kwh && (
                                        <div className="flex justify-between items-center px-2">
                                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Jumlah KWH</span>
                                            <span className="text-sm font-black text-slate-700 tracking-wider text-right">{kwh}</span>
                                        </div>
                                    )}
                                    <div className="h-px bg-slate-200/50 my-2" />
                                </>
                            );
                        }
                        return null;
                    })()}

                    <div className="flex justify-between items-center px-2">
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">ID Pelanggan</span>
                      <span className="text-sm font-black text-slate-700 tracking-wider bg-white px-3 py-1 rounded-lg border border-slate-200">{resultModal.customer_no || "-"}</span>
                    </div>
                    <div className="flex justify-between items-center px-2">
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Ref. System</span>
                      <span className="text-[11px] font-bold text-slate-500 font-mono italic opacity-60 truncate ml-8">{resultModal.ref_id || "-"}</span>
                    </div>
                    <div className="h-px bg-slate-200/50 my-2" />
                    <div className="flex justify-between items-center px-2">
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Waktu</span>
                      <span className="text-[11px] font-black text-slate-600 uppercase italic">{new Date().toLocaleString("id-ID")}</span>
                    </div>
                    <div className="flex justify-between items-center px-2">
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Total Bayar</span>
                      <span className="text-lg font-black text-emerald-600 tabular-nums">Rp {resultModal.price?.toLocaleString("id-ID") || "0"}</span>
                    </div>
                  </div>

                  {/* Info Box */}
                  <div className={cn(
                    "p-5 rounded-[1.5rem] flex gap-4 items-start border shadow-sm",
                    theme.lightBg,
                    theme.text,
                    "border-black/5"
                  )}>
                    <div className="mt-0.5">{theme.icon}</div>
                    <p className="text-xs font-black leading-relaxed mt-1 uppercase tracking-tight">{resultModal.message}</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] mb-2">Automated Hub System</div>
                    <div className="h-1 w-12 bg-slate-100 mx-auto rounded-full" />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-10 space-y-4">
                {/* DEBUG SECTION */}
                <div className="pt-2">
                  <button 
                    onClick={() => setShowDebug(!showDebug)} 
                    className="flex items-center justify-between w-full hover:bg-slate-200/50 p-3 rounded-2xl transition-all group"
                  >
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-600">
                      <Bug className="h-4 w-4" />
                      Server Log Data
                    </div>
                    {showDebug ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  
                  {showDebug && (
                    <div className="mt-4 p-6 bg-slate-900 rounded-[2rem] overflow-hidden animate-in slide-in-from-top-4 duration-500 shadow-inner">
                      <pre className="text-[10px] text-emerald-400/80 font-mono leading-relaxed overflow-x-auto whitespace-pre no-scrollbar">
                        {JSON.stringify(resultModal.raw_response, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                      {resultModal.status === "pending" && (
                        <Button 
                            className="flex-1 h-16 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-base flex gap-3 active:scale-95 shadow-xl shadow-amber-500/20 uppercase tracking-widest"
                            onClick={handleCheckStatus}
                            disabled={checkingStatus}
                        >
                            {checkingStatus ? <Loader2 className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
                            Cek Status
                        </Button>
                      )}
                      
                      {resultModal.status === "success" && (
                        <Button 
                            className="flex-1 h-16 rounded-2xl premium-gradient hover:opacity-95 text-white font-black text-base flex gap-3 shadow-xl shadow-blue-500/20 uppercase tracking-widest active:scale-95 transition-all"
                            onClick={downloadReceipt}
                            disabled={downloading}
                        >
                            {downloading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Download className="h-6 w-6" />}
                            Unduh Struk
                        </Button>
                      )}
                      
                      {resultModal.status === "success" && (
                        <Button 
                            className="h-16 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-sm flex gap-3 px-8 shadow-sm transition-all active:scale-95 uppercase tracking-widest"
                            variant="ghost"
                            onClick={() => {
                              const text = `ID Pelanggan: ${resultModal.customer_no}\nToken: ${resultModal.sn}\nWaktu: ${new Date().toLocaleString("id-ID")}`;
                              copyToClipboard(text);
                            }}
                        >
                            <Copy className="h-5 w-5" /> Salin
                        </Button>
                      )}
                  </div>

                  <Button 
                    className={cn(
                      "w-full h-18 rounded-[1.5rem] font-black text-xl transition-all active:scale-95 shadow-2xl text-white uppercase tracking-[0.2em]",
                      theme.btn,
                      theme.shadow
                    )}
                    onClick={() => setResultModal(prev => ({ ...prev, open: false }))}
                  >
                    Tutup
                  </Button>
                </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
