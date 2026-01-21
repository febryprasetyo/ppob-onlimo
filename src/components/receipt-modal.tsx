"use client";

import { useRef, useState } from "react";
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
  Image as ImageIcon
} from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toPng } from "html-to-image";

interface ReceiptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "PLN" | "ORBIT";
  status: "success" | "pending" | "failed";
  title: string;
  message: string;
  sn?: string;
  ref_id?: string;
  price?: number;
  raw_response?: any;
  station_name?: string;
  customer_no?: string;
  created_at?: string;
}

export function ReceiptModal({
  open,
  onOpenChange,
  type,
  status,
  title,
  message,
  sn,
  ref_id,
  price,
  raw_response,
  station_name,
  customer_no,
  created_at
}: ReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  const getModalTheme = () => {
    switch (status) {
      case "success": return { bg: "premium-gradient", lightBg: "bg-emerald-50", text: "text-emerald-800", icon: <CheckCircle2 className="h-10 w-10 text-emerald-600" />, shadow: "shadow-emerald-200", btn: "premium-gradient shadow-blue-500/20" };
      case "pending": return { bg: "bg-gradient-to-br from-amber-400 to-orange-500", lightBg: "bg-amber-50", text: "text-amber-800", icon: <Clock className="h-10 w-10 text-amber-500 animate-pulse" />, shadow: "shadow-amber-200", btn: "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20" };
      case "failed": return { bg: "bg-gradient-to-br from-rose-500 to-red-600", lightBg: "bg-rose-50", text: "text-rose-800", icon: <XCircle className="h-10 w-10 text-rose-600" />, shadow: "shadow-rose-200", btn: "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20" };
      default: return { bg: "bg-slate-600", lightBg: "bg-slate-50", text: "text-slate-800", icon: <Info className="h-10 w-10 text-slate-600" />, shadow: "shadow-slate-200", btn: "bg-slate-500 hover:bg-slate-600 shadow-slate-500/20" };
    }
  };

  const theme = getModalTheme();

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
      link.download = `Struk-${ref_id || 'transaksi'}.png`;
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl max-h-[95vh] flex flex-col bg-white">
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div id="receipt-container" ref={receiptRef} className="bg-white flex flex-col w-full">
            {/* Header Card */}
            <div className={cn(
              "p-12 text-center shrink-0 relative overflow-hidden transition-all duration-700",
              theme.bg
            )}>
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                {type === "PLN" ? <Zap className="h-40 w-40 text-black scale-150 rotate-12" /> : <Wifi className="h-40 w-40 text-black scale-150 rotate-12" />}
              </div>
              
              <div className="flex justify-center mb-6 relative z-10 animate-in zoom-in duration-500">
                <div className="bg-white p-5 rounded-[2rem] shadow-2xl shadow-black/20">
                  {theme.icon}
                </div>
              </div>
              <h2 className="text-3xl font-black text-white relative z-10 uppercase tracking-tight leading-none">{title}</h2>
              <p className="text-white/70 font-black text-[10px] mt-3 relative z-10 uppercase tracking-[0.3em]">{station_name}</p>
            </div>

            <div className="bg-white rounded-t-[3.5rem] -mt-10 relative z-20 p-10 space-y-8">
              
              {/* Token Display - PLN Only */}
              {type === "PLN" && (
                <div className={cn(
                  "border-2 border-dashed rounded-[2.5rem] p-8 space-y-5 text-center transition-all",
                  status === "pending" ? "bg-amber-50 border-amber-100" : "bg-slate-50 border-slate-100"
                )}>
                  <div className="flex items-center justify-center gap-2.5 text-slate-400">
                    <Ticket className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Listrik Prabayar (Token)</span>
                  </div>
                  
                  {(() => {
                    let tokenCode = sn || "-";
                    // Only Split and parse if it's a success string with separators
                    if (status === "success" && sn && sn.includes("/")) {
                       tokenCode = sn.split("/")[0].trim();
                    }

                    return (
                        <div className="relative group cursor-pointer" onClick={() => {
                            if (status === "success" && tokenCode !== "-") {
                                copyToClipboard(tokenCode);
                                // Optional: Add toast or visual feedback here if possible, 
                                // but for now the click action is sufficient.
                            }
                        }}>
                            <div className="bg-white rounded-3xl py-8 px-4 border border-slate-100 shadow-xl shadow-slate-200/50 min-h-[100px] flex items-center justify-center transition-all group-hover:scale-[1.02] group-active:scale-95 relative overflow-hidden">
                            {status === "success" ? (
                                <>
                                    <span className="text-4xl font-black text-slate-900 tracking-[0.15em] font-mono break-all px-2 select-all drop-shadow-sm relative z-10">
                                    {tokenCode}
                                    </span>
                                    <div className="absolute inset-0 bg-blue-50/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] bg-white px-3 py-1 rounded-full shadow-sm">
                                            Click to Copy
                                        </span>
                                    </div>
                                </>
                            ) : status === "pending" ? (
                                <div className="flex flex-col items-center gap-3 italic text-amber-600">
                                <Loader2 className="h-6 w-6 animate-spin" />
                                <span className="text-xs font-black tracking-widest uppercase">Sedang Diproses</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-3 text-rose-500 font-black uppercase tracking-widest">
                                <AlertTriangle className="h-6 w-6" />
                                <span className="text-xs">Gagal Mendapatkan Token</span>
                                </div>
                            )}
                            </div>
                        </div>
                    );
                  })()}
                </div>
              )}

              {/* Detail Grid */}
              <div className="grid grid-cols-1 gap-1 border-y border-slate-100 py-8">
                
                {/* Parse SN Details for PLN */}
                {(() => {
                    if (type === "PLN" && status === "success" && sn && sn.includes("/")) {
                        const parts = sn.split("/");
                        // Expected: TOKEN/NAMA/TARIF/DAYA/KWH or similar variations
                        // Let's rely on standard positions often used: 
                        // 1: Name, 2: Tarif/Daya (sometimes combined), 3: KWH? 
                        // The user screenshot showed: TOKEN/NAME/SEGMENT/KWH
                        // Adjusting based on user request "detail nama, segmen, dan kwh"
                        
                        const customerName = parts[1]?.trim();
                        let segmentPower = parts[2]?.trim(); // Often R1M/900VA or similar
                        // Format Tarif/Daya to have spaces around slash
                        if (segmentPower && segmentPower.includes("/")) {
                            segmentPower = segmentPower.replace(/\//g, " / ");
                        }
                        const kwh = parts[3]?.trim();

                        return (
                            <>
                                {customerName && (
                                    <div className="flex justify-between items-center py-2.5 group/item border-b border-slate-50">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover/item:text-blue-500 transition-colors">Nama Pelanggan</span>
                                        <span className="text-sm font-black text-slate-800 tracking-tight text-right w-[60%] truncate">{customerName}</span>
                                    </div>
                                )}
                                {segmentPower && (
                                    <div className="flex justify-between items-center py-2.5 group/item border-b border-slate-50">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover/item:text-blue-500 transition-colors">Tarif / Daya</span>
                                        <span className="text-sm font-black text-slate-800 tracking-tight text-right">{segmentPower}</span>
                                    </div>
                                )}
                                {kwh && (
                                    <div className="flex justify-between items-center py-2.5 group/item border-b border-slate-50">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover/item:text-blue-500 transition-colors">Jumlah KWH</span>
                                        <span className="text-sm font-black text-slate-800 tracking-tight text-right">{kwh}</span>
                                    </div>
                                )}
                            </>
                        );
                    }
                    return null;
                })()}

                <div className="flex justify-between items-center py-2.5 group/item">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover/item:text-blue-500 transition-colors">ID Pelanggan</span>
                  <span className="text-base font-black text-slate-800 tracking-tight">{customer_no || "-"}</span>
                </div>
                <div className="flex justify-between items-center py-2.5 group/item border-t border-slate-50">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover/item:text-blue-500 transition-colors">Ref ID</span>
                  <span className="text-[10px] font-black text-slate-500 font-mono tracking-tighter uppercase">{ref_id || "-"}</span>
                </div>
                <div className="flex justify-between items-center py-2.5 group/item border-t border-slate-50">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover/item:text-blue-500 transition-colors">Harga Provider</span>
                  <span className="text-xl font-black text-emerald-600 tabular-nums shadow-emerald-500/5 drop-shadow-sm">Rp {price?.toLocaleString("id-ID") || "0"}</span>
                </div>
                {type === "ORBIT" && sn && (
                  <div className="flex justify-between items-center p-5 premium-gradient rounded-3xl mt-4 shadow-xl shadow-blue-500/20">
                    <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">Serial Number</span>
                    <span className="text-sm font-black text-white font-mono select-all tracking-wider">{sn}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2.5 group/item border-t border-slate-50">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover/item:text-blue-500 transition-colors">Waktu TRX</span>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest tabular-nums">
                        {created_at 
                          ? new Date(created_at).toLocaleString("id-ID", { 
                              day: '2-digit', month: 'short', year: 'numeric', 
                              hour: '2-digit', minute: '2-digit' 
                            }) 
                          : new Date().toLocaleString()
                        }
                    </span>
                </div>
              </div>

              {/* Status Message */}
              <div className={cn(
                "p-6 rounded-3xl flex gap-4 items-center animate-pulse-subtle shadow-sm",
                theme.lightBg,
                theme.text
              )}>
                <div className="p-2.5 bg-white/50 rounded-2xl shadow-sm">
                  {status === "success" ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : 
                   status === "pending" ? <Clock className="h-5 w-5 shrink-0" /> : 
                   <AlertTriangle className="h-5 w-5 shrink-0" />}
                </div>
                <p className="text-[11px] font-black leading-relaxed uppercase tracking-wide">{message}</p>
              </div>
              
              <div className="text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] py-4 bg-slate-50 rounded-[2rem]">
                Onlimo Core v1.0.4 • Ops Unit
              </div>
            </div>
          </div>

          <div className="p-10 pt-0 bg-white space-y-6">
              {/* DEBUG SECTION */}
              {raw_response && (
                <div className="px-2">
                  <button 
                    onClick={() => setShowDebug(!showDebug)} 
                    className="flex items-center justify-between w-full hover:bg-slate-50 p-3 rounded-2xl transition-all border border-transparent hover:border-slate-100 group"
                  >
                    <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-blue-600 transition-colors">
                      <Bug className="h-3.5 w-3.5" />
                      Inquiry Debug Response
                    </div>
                    {showDebug ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                  </button>
                  
                  {showDebug && (
                    <div className="mt-4 p-5 bg-slate-900 rounded-[2.5rem] overflow-hidden animate-in zoom-in-95 duration-500 border border-slate-800 shadow-2xl">
                      <pre className="text-[10px] text-emerald-400/90 font-mono leading-relaxed overflow-x-auto whitespace-pre no-scrollbar">
                        {typeof raw_response === "string" ? raw_response : JSON.stringify(raw_response, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-4">
                <div className="flex gap-4">
                    {status === "success" && (
                    <Button 
                        className="flex-1 h-18 rounded-[1.5rem] bg-slate-950 hover:bg-black text-white font-black text-xs uppercase tracking-[0.2em] flex gap-3 shadow-2xl active:scale-95 transition-all"
                        onClick={downloadReceipt}
                        disabled={downloading}
                    >
                        {downloading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImageIcon className="h-5 w-5" />}
                        Unduh Struk
                    </Button>
                    )}
                    
                    {status === "success" && (
                    <Button 
                        className="flex-1 h-18 rounded-[1.5rem] bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-xs uppercase tracking-[0.2em] flex gap-3 shadow-sm active:scale-95 transition-all"
                        variant="ghost"
                        onClick={() => {
                        const text = `STRUK ${type}\nStasiun: ${station_name}\nID Pelanggan: ${customer_no}\nToken/SN: ${sn}\nRef ID: ${ref_id}\n\nWaktu: ${new Date().toLocaleString()}`;
                        copyToClipboard(text);
                        }}
                    >
                        <Copy className="h-5 w-5" /> Copy Teks
                    </Button>
                    )}
                </div>

                <Button 
                  className={cn(
                    "w-full h-18 rounded-[1.5rem] font-black uppercase text-xs tracking-[0.3em] transition-all active:scale-95 shadow-2xl text-white",
                    theme.btn
                  )}
                  onClick={() => onOpenChange(false)}
                >
                  Tutup Panel
                </Button>
              </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
