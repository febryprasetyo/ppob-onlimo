"use client";

import { useRef, useState } from "react";
import {
  Zap,
  Wifi,
  Smartphone,
  Globe,
  Wallet,
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
  Image as ImageIcon,
  Check,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toPng } from "html-to-image";

interface TopupReceiptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: {
    reference: string;
    category?: string;
    product_name?: string;
    product_snapshot?: any;
    customer_target: string;
    final_price: number;
    status: string;
    supplier_message?: string | null;
    serial_number?: string | null;
    token?: string | null;
    submitted_at?: string | Date;
    completed_at?: string | Date | null;
    operator_username?: string;
    raw_response?: any;
  } | null;
}

export function TopupReceiptModal({
  open,
  onOpenChange,
  transaction,
}: TopupReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  if (!transaction) return null;

  const rawStatus = (transaction.status || "").toLowerCase();
  const status: "success" | "pending" | "failed" =
    rawStatus === "success" || rawStatus === "sukses"
      ? "success"
      : rawStatus === "pending" || rawStatus === "submitted"
      ? "pending"
      : "failed";

  const category = transaction.category || "TOPUP";

  const productName =
    transaction.product_name ||
    (typeof transaction.product_snapshot === "string"
      ? JSON.parse(transaction.product_snapshot).name
      : transaction.product_snapshot?.name) ||
    category;

  const getServiceIcon = () => {
    switch (category) {
      case "PLN_TOKEN":
        return <Zap className="h-10 w-10 text-amber-500" />;
      case "PAKET_DATA":
        return <Wifi className="h-10 w-10 text-cyan-600" />;
      case "INTERNET_BILL":
        return <Globe className="h-10 w-10 text-rose-600" />;
      case "EMONEY":
        return <Wallet className="h-10 w-10 text-emerald-600" />;
      default:
        return <Smartphone className="h-10 w-10 text-blue-600" />;
    }
  };

  const getModalTheme = () => {
    switch (status) {
      case "success":
        return {
          bg: "premium-gradient",
          lightBg: "bg-emerald-50",
          text: "text-emerald-800",
          icon: <CheckCircle2 className="h-10 w-10 text-emerald-600" />,
          shadow: "shadow-emerald-200",
          btn: "premium-gradient shadow-blue-500/20",
        };
      case "pending":
        return {
          bg: "bg-gradient-to-br from-amber-400 to-orange-500",
          lightBg: "bg-amber-50",
          text: "text-amber-800",
          icon: <Clock className="h-10 w-10 text-amber-500 animate-pulse" />,
          shadow: "shadow-amber-200",
          btn: "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20",
        };
      case "failed":
        return {
          bg: "bg-gradient-to-br from-rose-500 to-red-600",
          lightBg: "bg-rose-50",
          text: "text-rose-800",
          icon: <XCircle className="h-10 w-10 text-rose-600" />,
          shadow: "shadow-rose-200",
          btn: "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20",
        };
      default:
        return {
          bg: "bg-slate-600",
          lightBg: "bg-slate-50",
          text: "text-slate-800",
          icon: <Info className="h-10 w-10 text-slate-600" />,
          shadow: "shadow-slate-200",
          btn: "bg-slate-500 hover:bg-slate-600 shadow-slate-500/20",
        };
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
          borderRadius: "0px",
        },
      });
      const link = document.createElement("a");
      link.download = `Struk-${transaction.reference || "topup"}.png`;
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
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const title =
    status === "success"
      ? "Transaksi Berhasil"
      : status === "pending"
      ? "Sedang Diproses"
      : "Transaksi Gagal";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl max-h-[95vh] flex flex-col bg-white">
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div id="receipt-container" ref={receiptRef} className="bg-white flex flex-col w-full">
            {/* Header Card */}
            <div
              className={cn(
                "p-12 text-center shrink-0 relative overflow-hidden transition-all duration-700",
                theme.bg
              )}
            >
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                {category === "PLN_TOKEN" ? (
                  <Zap className="h-40 w-40 text-black scale-150 rotate-12" />
                ) : (
                  <Smartphone className="h-40 w-40 text-black scale-150 rotate-12" />
                )}
              </div>

              <div className="flex justify-center mb-6 relative z-10 animate-in zoom-in duration-500">
                <div className="bg-white p-5 rounded-[2rem] shadow-2xl shadow-black/20">
                  {theme.icon}
                </div>
              </div>
              <DialogTitle className="text-3xl font-black text-white relative z-10 uppercase tracking-tight leading-none">
                {title}
              </DialogTitle>
              <DialogDescription className="text-white/80 font-black text-[10px] mt-3 relative z-10 uppercase tracking-[0.3em]">
                {productName}
              </DialogDescription>
            </div>

            <div className="bg-white rounded-t-[3.5rem] -mt-10 relative z-20 p-10 space-y-8">
              {/* Token Display - PLN Token Only */}
              {category === "PLN_TOKEN" && (
                <div
                  className={cn(
                    "border-2 border-dashed rounded-[2.5rem] p-8 space-y-5 text-center transition-all",
                    status === "pending"
                      ? "bg-amber-50 border-amber-100"
                      : "bg-slate-50 border-slate-100"
                  )}
                >
                  <div className="flex items-center justify-center gap-2.5 text-slate-400">
                    <Ticket className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                      Listrik Prabayar (Token PLN)
                    </span>
                  </div>

                  {(() => {
                    let tokenCode = transaction.token || transaction.serial_number || "-";
                    if (status === "success" && tokenCode && tokenCode.includes("/")) {
                      tokenCode = tokenCode.split("/")[0].trim();
                    }

                    return (
                      <div
                        className="relative group cursor-pointer"
                        onClick={() => {
                          if (status === "success" && tokenCode !== "-") {
                            copyToClipboard(tokenCode);
                          }
                        }}
                      >
                        <div className="bg-white rounded-3xl py-8 px-4 border border-slate-100 shadow-xl shadow-slate-200/50 min-h-[100px] flex items-center justify-center transition-all group-hover:scale-[1.02] group-active:scale-95 relative overflow-hidden">
                          {status === "success" ? (
                            <>
                              <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-[0.15em] font-mono break-all px-2 select-all drop-shadow-sm relative z-10">
                                {tokenCode.match(/.{1,4}/g)?.join(" ") || tokenCode}
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
                              <span className="text-xs font-black tracking-widest uppercase">
                                Sedang Diproses Supplier
                              </span>
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
                <div className="flex justify-between items-center py-2.5 group/item">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover/item:text-blue-500 transition-colors">
                    Layanan
                  </span>
                  <span className="text-sm font-black text-slate-800 tracking-tight">
                    {category}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2.5 group/item border-t border-slate-50">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover/item:text-blue-500 transition-colors">
                    Produk
                  </span>
                  <span className="text-sm font-black text-slate-800 tracking-tight text-right w-[60%] truncate">
                    {productName}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2.5 group/item border-t border-slate-50">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover/item:text-blue-500 transition-colors">
                    Nomor / ID Tujuan
                  </span>
                  <span className="text-base font-black text-slate-800 font-mono tracking-tight">
                    {transaction.customer_target}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2.5 group/item border-t border-slate-50">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover/item:text-blue-500 transition-colors">
                    No. Referensi
                  </span>
                  <span className="text-[11px] font-black text-slate-500 font-mono tracking-tighter uppercase">
                    {transaction.reference}
                  </span>
                </div>

                {category !== "PLN_TOKEN" && transaction.serial_number && (
                  <div className="flex justify-between items-center p-5 premium-gradient rounded-3xl mt-4 shadow-xl shadow-blue-500/20">
                    <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">
                      Serial Number (SN)
                    </span>
                    <span className="text-sm font-black text-white font-mono select-all tracking-wider">
                      {transaction.serial_number}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center py-2.5 group/item border-t border-slate-50">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover/item:text-blue-500 transition-colors">
                    Total Pembayaran
                  </span>
                  <span className="text-2xl font-black text-emerald-600 tabular-nums shadow-emerald-500/5 drop-shadow-sm font-mono">
                    Rp {Number(transaction.final_price || 0).toLocaleString("id-ID")}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2.5 group/item border-t border-slate-50">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover/item:text-blue-500 transition-colors">
                    Waktu Transaksi
                  </span>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest tabular-nums">
                    {transaction.submitted_at
                      ? new Date(transaction.submitted_at).toLocaleString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : new Date().toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              {/* Status Message */}
              <div
                className={cn(
                  "p-6 rounded-3xl flex gap-4 items-center animate-pulse-subtle shadow-sm",
                  theme.lightBg,
                  theme.text
                )}
              >
                <div className="p-2.5 bg-white/50 rounded-2xl shadow-sm">
                  {status === "success" ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                  ) : status === "pending" ? (
                    <Clock className="h-5 w-5 shrink-0" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 shrink-0" />
                  )}
                </div>
                <p className="text-[11px] font-black leading-relaxed uppercase tracking-wide">
                  {transaction.supplier_message ||
                    (status === "success"
                      ? "Transaksi Berhasil Diproses"
                      : "Sedang Menunggu Konfirmasi Supplier")}
                </p>
              </div>

              <div className="text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] py-4 bg-slate-50 rounded-[2rem]">
                ONLIMO Core v1.0.4 • PPOB Merchant
              </div>
            </div>
          </div>

          <div className="p-10 pt-0 bg-white space-y-6">
            {/* DEBUG SECTION */}
            {transaction.raw_response && (
              <div className="px-2">
                <button
                  onClick={() => setShowDebug(!showDebug)}
                  className="flex items-center justify-between w-full hover:bg-slate-50 p-3 rounded-2xl transition-all border border-transparent hover:border-slate-100 group"
                >
                  <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-blue-600 transition-colors">
                    <Bug className="h-3.5 w-3.5" />
                    Supplier Debug Response
                  </div>
                  {showDebug ? (
                    <ChevronUp className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  )}
                </button>

                {showDebug && (
                  <div className="mt-4 p-5 bg-slate-900 rounded-[2.5rem] overflow-hidden animate-in zoom-in-95 duration-500 border border-slate-800 shadow-2xl">
                    <pre className="text-[10px] text-emerald-400/90 font-mono leading-relaxed overflow-x-auto whitespace-pre no-scrollbar">
                      {typeof transaction.raw_response === "string"
                        ? transaction.raw_response
                        : JSON.stringify(transaction.raw_response, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-4">
              <div className="flex gap-4">
                {status === "success" && (
                  <Button
                    className="flex-1 h-16 rounded-[1.5rem] bg-slate-950 hover:bg-black text-white font-black text-xs uppercase tracking-[0.2em] flex gap-3 shadow-2xl active:scale-95 transition-all"
                    onClick={downloadReceipt}
                    disabled={downloading}
                  >
                    {downloading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <ImageIcon className="h-5 w-5" />
                    )}
                    Unduh Struk
                  </Button>
                )}

                {status === "success" && (
                  <Button
                    className="flex-1 h-16 rounded-[1.5rem] bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-xs uppercase tracking-[0.2em] flex gap-3 shadow-sm active:scale-95 transition-all"
                    variant="ghost"
                    onClick={() => {
                      const text = `STRUK TOPUP ONLIMO\nLayanan: ${category}\nProduk: ${productName}\nNomor Tujuan: ${transaction.customer_target}\nToken/SN: ${transaction.token || transaction.serial_number || "-"}\nRef ID: ${transaction.reference}\nTotal: Rp ${Number(transaction.final_price).toLocaleString("id-ID")}\n\nWaktu: ${new Date().toLocaleString("id-ID")}`;
                      copyToClipboard(text);
                    }}
                  >
                    {copiedText ? (
                      <Check className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <Copy className="h-5 w-5" />
                    )}
                    {copiedText ? "Tersalin!" : "Copy Teks"}
                  </Button>
                )}
              </div>

              <Button
                className={cn(
                  "w-full h-16 rounded-[1.5rem] font-black uppercase text-xs tracking-[0.3em] transition-all active:scale-95 shadow-2xl text-white",
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
