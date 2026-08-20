"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Smartphone,
  Wifi,
  Wallet,
  Zap,
  Globe,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  FileSpreadsheet,
  Upload,
  Receipt,
  Eye,
  Check,
  X,
  CreditCard,
  Layers,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { detectPhoneProvider, PhoneProvider, PROVIDER_DETAILS } from "@/lib/topup/phone-prefix-detector";
import { TopupProduct, TopupCategory } from "@/lib/topup/types";
import { TopupReceiptModal } from "@/components/topup/topup-receipt-modal";

const CATEGORIES: { id: TopupCategory; name: string; icon: any; desc: string }[] = [
  { id: "PULSA", name: "Pulsa Reguler", icon: Smartphone, desc: "Isi ulang pulsa semua operator" },
  { id: "PAKET_DATA", name: "Paket Data", icon: Wifi, desc: "Paket kuota internet & data" },
  { id: "EMONEY", name: "Top-up E-Money", icon: Wallet, desc: "DANA, GoPay, OVO, ShopeePay, LinkAja" },
  { id: "PLN_TOKEN", name: "Token Listrik PLN", icon: Zap, desc: "Beli token listrik prabayar PLN" },
  { id: "INTERNET_BILL", name: "IndiHome / Speedy", icon: Globe, desc: "Cek & bayar tagihan internet" },
];

const EMONEY_BRANDS = [
  { id: "ALL", name: "Semua E-Wallet" },
  { id: "DANA", name: "DANA" },
  { id: "GOPAY", name: "GoPay" },
  { id: "OVO", name: "OVO" },
  { id: "SHOPEEPAY", name: "ShopeePay" },
  { id: "LINKAJA", name: "LinkAja" },
];

const QUICK_AMOUNTS = [20000, 25000, 50000, 100000, 150000, 200000, 300000, 500000];

export default function TopupMerchantPage() {
  const [activeTab, setActiveTab] = useState<"catalog" | "history" | "admin_import">("catalog");
  const [selectedCategory, setSelectedCategory] = useState<TopupCategory>("PULSA");

  // Catalog State
  const [products, setProducts] = useState<TopupProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [searchProduct, setSearchProduct] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<TopupProduct | null>(null);

  // Form Inputs
  const [customerTarget, setCustomerTarget] = useState("");
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>("ALL");
  const [autoDetectedProvider, setAutoDetectedProvider] = useState<PhoneProvider>("UNKNOWN");

  // E-Money specific
  const [emoneyMode, setEmoneyMode] = useState<"FIXED" | "VARIABLE">("VARIABLE");
  const [customAmount, setCustomAmount] = useState<number>(50000);
  const [inquiryResult, setInquiryResult] = useState<any | null>(null);
  const [checkingInquiry, setCheckingInquiry] = useState(false);

  // PLN Subscriber specific
  const [plnSubscriber, setPlnSubscriber] = useState<{ name: string; segment_power?: string } | null>(null);
  const [checkingPln, setCheckingPln] = useState(false);

  // Transaction Processing State
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // History State
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyFilterCategory, setHistoryFilterCategory] = useState("ALL");
  const [historyFilterStatus, setHistoryFilterStatus] = useState("ALL");
  const [historySearch, setHistorySearch] = useState("");
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPagination, setHistoryPagination] = useState({ total: 0, totalPages: 1 });
  const [checkingStatusRef, setCheckingStatusRef] = useState<string | null>(null);

  // Admin Import State
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any | null>(null);

  // Auto-detect Provider on phone input change
  useEffect(() => {
    if (selectedCategory === "PULSA" || selectedCategory === "PAKET_DATA") {
      const info = detectPhoneProvider(customerTarget);
      setAutoDetectedProvider(info.provider);
      if (info.provider !== "UNKNOWN") {
        setSelectedBrandFilter(info.provider);
      }
    }
  }, [customerTarget, selectedCategory]);

  // Load Products when category changes
  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await fetch(`/api/topup/catalog?category=${selectedCategory}`);
      const json = await res.json();
      if (json.success) {
        setProducts(json.data);
      }
    } catch (err) {
      console.error("Fetch products failed:", err);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    setSelectedProduct(null);
    setInquiryResult(null);
    setPlnSubscriber(null);
    setErrorMessage(null);
  }, [selectedCategory]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedBrandFilter !== "ALL") {
        if (p.brand.toUpperCase() !== selectedBrandFilter.toUpperCase()) {
          return false;
        }
      }

      if (selectedCategory === "EMONEY") {
        if (emoneyMode === "VARIABLE" && p.nominal_type !== "VARIABLE") return false;
        if (emoneyMode === "FIXED" && p.nominal_type !== "FIXED") return false;
      }

      if (searchProduct) {
        const q = searchProduct.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
      }

      return true;
    });
  }, [products, selectedBrandFilter, searchProduct, selectedCategory, emoneyMode]);

  // Automatically select first product for single service (IndiHome or E-Money variable)
  useEffect(() => {
    if (selectedCategory === "INTERNET_BILL" && products.length > 0) {
      setSelectedProduct(products[0]);
    } else if (selectedCategory === "EMONEY" && emoneyMode === "VARIABLE" && filteredProducts.length > 0) {
      setSelectedProduct(filteredProducts[0]);
    }
  }, [selectedCategory, products, emoneyMode, filteredProducts]);

  // 1. PLN Subscriber Check
  const handleCheckPln = async () => {
    if (!customerTarget || customerTarget.length < 10) {
      setErrorMessage("Masukkan minimal 10 digit nomor meter / ID PLN");
      return;
    }
    setCheckingPln(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/topup/inquiries/pln", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_no: customerTarget }),
      });
      const json = await res.json();
      if (json.success) {
        setPlnSubscriber(json.data);
      } else {
        setErrorMessage(json.error || "ID PLN tidak ditemukan");
        setPlnSubscriber(null);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal memeriksa ID PLN");
    } finally {
      setCheckingPln(false);
    }
  };

  // 2. Bill Inquiry
  const handleCheckBillInquiry = async () => {
    if (!customerTarget) {
      setErrorMessage("Nomor / ID tujuan wajib diisi");
      return;
    }
    if (!selectedProduct) {
      setErrorMessage("Pilih produk terlebih dahulu");
      return;
    }

    setCheckingInquiry(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/topup/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: selectedProduct.id,
          customer_target: customerTarget,
          amount: selectedProduct.category === "EMONEY" ? customAmount : undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setInquiryResult(json.data);
      } else {
        setErrorMessage(json.error || "Gagal melakukan inquiry tagihan");
        setInquiryResult(null);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal melakukan inquiry tagihan");
    } finally {
      setCheckingInquiry(false);
    }
  };

  // 3. Process Prepaid
  const handleProcessPrepaid = async () => {
    if (!selectedProduct || !customerTarget) return;

    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/topup/transactions/prepaid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: selectedProduct.id,
          customer_target: customerTarget,
          idempotency_key: `idem-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        }),
      });
      const json = await res.json();
      if (json.success || json.data?.reference) {
        setLastTransaction(json.data);
        setConfirmModalOpen(false);
        setReceiptModalOpen(true);
        setCustomerTarget("");
        setSelectedProduct(null);
        setPlnSubscriber(null);
      } else {
        setErrorMessage(json.error || "Transaksi gagal diproses");
        setConfirmModalOpen(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Terjadi kesalahan saat memproses transaksi");
      setConfirmModalOpen(false);
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. Process Postpaid
  const handleProcessPostpaid = async () => {
    if (!inquiryResult) return;

    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/topup/transactions/postpaid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inquiry_id: inquiryResult.inquiry_id,
          idempotency_key: `idem-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        }),
      });
      const json = await res.json();
      if (json.success || json.data?.reference) {
        setLastTransaction(json.data);
        setConfirmModalOpen(false);
        setReceiptModalOpen(true);
        setInquiryResult(null);
        setCustomerTarget("");
      } else {
        setErrorMessage(json.error || "Pembayaran gagal diproses");
        setConfirmModalOpen(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Terjadi kesalahan saat pembayaran");
      setConfirmModalOpen(false);
    } finally {
      setIsProcessing(false);
    }
  };

  // Load Transactions History
  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const params = new URLSearchParams({
        category: historyFilterCategory,
        status: historyFilterStatus,
        q: historySearch,
        page: String(historyPage),
        limit: "15",
      });
      const res = await fetch(`/api/topup/transactions?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setHistoryList(json.data);
        setHistoryPagination(json.pagination);
      }
    } catch (err) {
      console.error("Fetch history failed:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === "history") {
      fetchHistory();
    }
  }, [activeTab, historyFilterCategory, historyFilterStatus, historyPage]);

  // Check Status for Pending Transaction
  const handleCheckStatus = async (reference: string) => {
    setCheckingStatusRef(reference);
    try {
      const res = await fetch(`/api/topup/transactions/${reference}/status-check`, {
        method: "POST",
      });
      const json = await res.json();
      if (json.success) {
        setHistoryList((prev) =>
          prev.map((item) =>
            item.reference === reference
              ? {
                  ...item,
                  status: json.data.status,
                  serial_number: json.data.serial_number,
                  token: json.data.token,
                  supplier_message: json.data.supplier_message,
                }
              : item
          )
        );
      }
    } catch (err) {
      console.error("Status check failed:", err);
    } finally {
      setCheckingStatusRef(null);
    }
  };

  // Upload Catalog CSV (Admin)
  const handleUploadCsv = async () => {
    if (!csvFile) return;
    setImporting(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append("file", csvFile);
      const res = await fetch("/api/topup/catalog/import", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      setImportResult(json);
      if (json.success) {
        fetchProducts();
      }
    } catch (err: any) {
      setImportResult({ success: false, error: err.message });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-8 animate-slide-in-bottom pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 flex items-center gap-4">
            <div className="p-3 premium-gradient rounded-2xl shadow-xl shadow-blue-500/20">
              <Wallet className="h-8 w-8 text-white" />
            </div>
            <span className="text-gradient">Topup Merchant</span>
          </h1>
          <p className="text-slate-500 mt-3 font-bold text-sm uppercase tracking-widest pl-1 border-l-4 border-blue-500 ml-1">
            PPOB Operations • 5 Layanan Transaksi Terpadu
          </p>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex items-center gap-2 bg-white/70 p-2 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-white">
          <button
            onClick={() => setActiveTab("catalog")}
            className={cn(
              "px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all",
              activeTab === "catalog"
                ? "premium-gradient text-white shadow-lg shadow-blue-500/20 scale-105"
                : "text-slate-400 hover:text-slate-700"
            )}
          >
            Katalog & Kasir
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={cn(
              "px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all",
              activeTab === "history"
                ? "premium-gradient text-white shadow-lg shadow-blue-500/20 scale-105"
                : "text-slate-400 hover:text-slate-700"
            )}
          >
            Riwayat Transaksi
          </button>
          <button
            onClick={() => setActiveTab("admin_import")}
            className={cn(
              "px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all",
              activeTab === "admin_import"
                ? "premium-gradient text-white shadow-lg shadow-blue-500/20 scale-105"
                : "text-slate-400 hover:text-slate-700"
            )}
          >
            Kelola Katalog
          </button>
        </div>
      </div>

      {/* Error / Alert Section */}
      {errorMessage && (
        <div className="p-6 rounded-[2rem] bg-rose-50 text-rose-900 border border-rose-100 flex items-center justify-between gap-4 shadow-xl shadow-rose-900/5 animate-in zoom-in-95 duration-300">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-2xl shadow-sm">
              <AlertCircle className="h-6 w-6 text-rose-500" />
            </div>
            <p className="text-sm font-black uppercase tracking-tight">{errorMessage}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setErrorMessage(null)}
            className="text-rose-500 hover:bg-rose-100/50 rounded-xl"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* TAB 1: KATALOG & KASIR */}
      {activeTab === "catalog" && (
        <div className="space-y-8">
          {/* Category Selector Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "flex flex-col items-start p-6 rounded-[2rem] border transition-all duration-300 text-left relative overflow-hidden group bg-white shadow-xl shadow-slate-200/40",
                    isSelected
                      ? "border-blue-600 ring-4 ring-blue-500/10 shadow-blue-500/10 -translate-y-1"
                      : "border-slate-100 hover:border-slate-200 hover:-translate-y-0.5"
                  )}
                >
                  <div
                    className={cn(
                      "p-3.5 rounded-2xl mb-4 shadow-lg transition-transform group-hover:scale-110",
                      isSelected
                        ? "premium-gradient text-white shadow-blue-500/30"
                        : "bg-slate-100 text-slate-700"
                    )}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="font-black text-slate-900 text-base uppercase tracking-tight">
                    {cat.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider line-clamp-1 mt-1">
                    {cat.desc}
                  </span>
                  {isSelected && (
                    <div className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-blue-600 shadow-md shadow-blue-500" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Main Form & Products Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Area: Form Inputs and Catalog Grid */}
            <div className="lg:col-span-8 space-y-6">
              {/* Form Input Card */}
              <div className="bg-white/50 backdrop-blur-md rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-white p-8 space-y-6">
                {/* Pulsa & Paket Data Input */}
                {(selectedCategory === "PULSA" || selectedCategory === "PAKET_DATA") && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Nomor Handphone Pelanggan
                      </label>
                      {autoDetectedProvider !== "UNKNOWN" && (
                        <Badge className="bg-blue-50 text-blue-600 border border-blue-100 font-black uppercase text-[10px] tracking-widest px-3 py-1 rounded-xl">
                          {PROVIDER_DETAILS[autoDetectedProvider].name}
                        </Badge>
                      )}
                    </div>

                    <div className="relative group">
                      <Input
                        type="tel"
                        value={customerTarget}
                        onChange={(e) => setCustomerTarget(e.target.value)}
                        placeholder="081234567890"
                        className="pl-14 h-16 bg-white border-slate-100 shadow-sm focus-visible:ring-4 focus-visible:ring-blue-500/5 text-xl font-mono rounded-[1.8rem] transition-all font-black placeholder:text-slate-300"
                      />
                      <Smartphone className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                    </div>

                    {/* Brand Filter Tags */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        Filter Brand:
                      </span>
                      {["ALL", "TELKOMSEL", "INDOSAT", "XL", "AXIS", "TRI", "SMARTFREN", "BYU"].map((b) => (
                        <button
                          key={b}
                          onClick={() => setSelectedBrandFilter(b)}
                          className={cn(
                            "px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border",
                            selectedBrandFilter === b
                              ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20"
                              : "bg-white text-slate-400 border-slate-100 hover:bg-blue-50 hover:text-blue-600"
                          )}
                        >
                          {b === "ALL" ? "Semua" : PROVIDER_DETAILS[b as PhoneProvider]?.name || b}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* E-Money Input */}
                {selectedCategory === "EMONEY" && (
                  <div className="space-y-6">
                    {/* Brand Selector Pills */}
                    <div className="flex flex-wrap items-center gap-2">
                      {EMONEY_BRANDS.map((b) => (
                        <button
                          key={b.id}
                          onClick={() => setSelectedBrandFilter(b.id)}
                          className={cn(
                            "px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border",
                            selectedBrandFilter === b.id
                              ? "premium-gradient text-white border-blue-600 shadow-lg shadow-blue-500/20 scale-105"
                              : "bg-white text-slate-500 border-slate-100 hover:bg-slate-50 hover:text-slate-900"
                          )}
                        >
                          {b.name}
                        </button>
                      ))}
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl w-fit">
                      <button
                        onClick={() => {
                          setEmoneyMode("VARIABLE");
                          setInquiryResult(null);
                        }}
                        className={cn(
                          "px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                          emoneyMode === "VARIABLE" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400"
                        )}
                      >
                        Bebas Nominal (Inquiry)
                      </button>
                      <button
                        onClick={() => {
                          setEmoneyMode("FIXED");
                          setInquiryResult(null);
                        }}
                        className={cn(
                          "px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                          emoneyMode === "FIXED" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400"
                        )}
                      >
                        Nominal Tetap
                      </button>
                    </div>

                    {/* Phone Input */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Nomor Handphone Terdaftar E-Wallet
                      </label>
                      <div className="relative group">
                        <Input
                          type="tel"
                          value={customerTarget}
                          onChange={(e) => setCustomerTarget(e.target.value)}
                          placeholder="081288889999"
                          className="pl-14 h-16 bg-white border-slate-100 shadow-sm focus-visible:ring-4 focus-visible:ring-blue-500/5 text-xl font-mono rounded-[1.8rem] transition-all font-black placeholder:text-slate-300"
                        />
                        <Wallet className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                      </div>
                    </div>

                    {/* Custom Amount for Variable E-Money */}
                    {emoneyMode === "VARIABLE" && (
                      <div className="space-y-4 pt-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Nominal Top-Up (Rp 10.000 - Rp 10.000.000)
                        </label>
                        <Input
                          type="number"
                          value={customAmount}
                          onChange={(e) => setCustomAmount(Number(e.target.value))}
                          step={1000}
                          min={10000}
                          max={10000000}
                          className="h-16 bg-white border-slate-100 shadow-sm focus-visible:ring-4 focus-visible:ring-blue-500/5 text-xl font-mono rounded-[1.8rem] font-black px-6"
                        />

                        {/* Quick Chips */}
                        <div className="flex flex-wrap gap-2">
                          {QUICK_AMOUNTS.map((amt) => (
                            <button
                              key={amt}
                              onClick={() => setCustomAmount(amt)}
                              className={cn(
                                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                                customAmount === amt
                              ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                              : "bg-white text-slate-500 border-slate-100 hover:bg-slate-50"
                              )}
                            >
                              Rp {amt.toLocaleString("id-ID")}
                            </button>
                          ))}
                        </div>

                        <Button
                          onClick={handleCheckBillInquiry}
                          disabled={checkingInquiry || !customerTarget}
                          className="w-full premium-gradient text-white h-16 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-500/20"
                        >
                          {checkingInquiry ? <RefreshCw className="h-5 w-5 animate-spin mr-2" /> : <ShieldCheck className="h-5 w-5 mr-2" />}
                          <span>Cek Biaya & Inquiry E-Money</span>
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Token PLN Input */}
                {selectedCategory === "PLN_TOKEN" && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Nomor Meter / ID Pelanggan PLN
                      </label>
                      <div className="flex gap-4">
                        <div className="relative group flex-1">
                          <Input
                            type="text"
                            value={customerTarget}
                            onChange={(e) => setCustomerTarget(e.target.value)}
                            placeholder="530000000001 (11-12 Digit)"
                            className="pl-14 h-16 bg-white border-slate-100 shadow-sm focus-visible:ring-4 focus-visible:ring-blue-500/5 text-xl font-mono rounded-[1.8rem] transition-all font-black placeholder:text-slate-300"
                          />
                          <Zap className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-300 group-focus-within:text-amber-500 transition-colors" />
                        </div>
                        <Button
                          onClick={handleCheckPln}
                          disabled={checkingPln || !customerTarget}
                          className="premium-gradient text-white h-16 px-8 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-500/20 shrink-0"
                        >
                          {checkingPln ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                          <span className="ml-2 hidden sm:inline">Cek Pelanggan</span>
                        </Button>
                      </div>
                    </div>

                    {/* PLN Subscriber Info Card */}
                    {plnSubscriber && (
                      <div className="p-6 rounded-[2rem] bg-amber-50 border border-amber-100 flex items-center justify-between shadow-lg shadow-amber-500/5 animate-in zoom-in-95">
                        <div className="space-y-1">
                          <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">
                            Nama Pelanggan Terverifikasi
                          </span>
                          <div className="text-xl font-black text-slate-900 uppercase tracking-tight">
                            {plnSubscriber.name || "PELANGGAN PLN"}
                          </div>
                          {plnSubscriber.segment_power && (
                            <div className="text-xs font-bold text-amber-800 tracking-wider">
                              {plnSubscriber.segment_power}
                            </div>
                          )}
                        </div>
                        <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-100 font-black uppercase text-[10px] tracking-widest px-3 py-1.5 rounded-xl gap-1.5">
                          <Check className="h-3.5 w-3.5" /> Terverifikasi
                        </Badge>
                      </div>
                    )}
                  </div>
                )}

                {/* IndiHome Input */}
                {selectedCategory === "INTERNET_BILL" && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Nomor / ID Pelanggan IndiHome / Speedy
                      </label>
                      <div className="flex gap-4">
                        <div className="relative group flex-1">
                          <Input
                            type="text"
                            value={customerTarget}
                            onChange={(e) => setCustomerTarget(e.target.value)}
                            placeholder="123456789012"
                            className="pl-14 h-16 bg-white border-slate-100 shadow-sm focus-visible:ring-4 focus-visible:ring-blue-500/5 text-xl font-mono rounded-[1.8rem] transition-all font-black placeholder:text-slate-300"
                          />
                          <Globe className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-300 group-focus-within:text-rose-500 transition-colors" />
                        </div>
                        <Button
                          onClick={handleCheckBillInquiry}
                          disabled={checkingInquiry || !customerTarget}
                          className="premium-gradient text-white h-16 px-8 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-500/20 shrink-0"
                        >
                          {checkingInquiry ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                          <span className="ml-2 hidden sm:inline">Cek Tagihan</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Inquiry Result Card */}
              {inquiryResult && (
                <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-slate-200/60 border border-slate-100 space-y-6 animate-in zoom-in-95">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-100">
                    <div>
                      <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-100 font-black uppercase text-[10px] tracking-widest px-3 py-1 rounded-xl mb-2">
                        Hasil Inquiry Tagihan Terverifikasi
                      </Badge>
                      <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                        {inquiryResult.customer_name || "Pelanggan"}
                      </h3>
                      <p className="text-xs font-mono font-bold text-slate-400 mt-1">
                        ID: {inquiryResult.customer_target} • Ref: {inquiryResult.supplier_ref_id}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Total Tagihan Final
                      </span>
                      <div className="text-3xl font-black text-emerald-600 font-mono">
                        Rp {Number(inquiryResult.final_price).toLocaleString("id-ID")}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Biaya Admin
                      </span>
                      <div className="text-base font-black text-slate-900 mt-1 font-mono">
                        Rp {Number(inquiryResult.admin_fee).toLocaleString("id-ID")}
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Periode Tagihan
                      </span>
                      <div className="text-base font-black text-slate-900 mt-1">
                        {inquiryResult.bill_period || "-"}
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Batas Waktu
                      </span>
                      <div className="text-base font-black text-amber-600 mt-1">
                        15 Menit (Hari Ini)
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Status
                      </span>
                      <div className="text-base font-black text-emerald-600 mt-1">
                        Siap Dibayar
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Products Grid for Prepaid Services */}
              {(selectedCategory !== "INTERNET_BILL" && !(selectedCategory === "EMONEY" && emoneyMode === "VARIABLE")) && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                        Pilihan Nominal Produk
                      </h3>
                      <Badge className="bg-slate-100 text-slate-600 border-none font-black text-[10px] uppercase px-3 py-1 rounded-xl">
                        {filteredProducts.length} Produk
                      </Badge>
                    </div>

                    <div className="relative w-full sm:w-64">
                      <Input
                        type="text"
                        value={searchProduct}
                        onChange={(e) => setSearchProduct(e.target.value)}
                        placeholder="Cari nominal..."
                        className="pl-10 h-12 bg-white border-slate-100 shadow-sm text-xs rounded-2xl font-bold"
                      />
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                    </div>
                  </div>

                  {loadingProducts ? (
                    <div className="p-16 text-center text-slate-400 bg-white rounded-[2.5rem] shadow-xl border border-slate-100">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3 text-blue-500" />
                      <span className="text-xs font-black uppercase tracking-widest">Memuat katalog produk...</span>
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="p-16 text-center text-slate-400 bg-white rounded-[2.5rem] shadow-xl border border-slate-100">
                      <AlertCircle className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                      <p className="text-base font-black text-slate-700 uppercase tracking-tight">Tidak ada produk yang sesuai</p>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Coba ubah filter atau kata kunci pencarian</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {filteredProducts.map((p) => {
                        const isSelected = selectedProduct?.id === p.id;
                        return (
                          <button
                            key={p.id}
                            onClick={() => setSelectedProduct(p)}
                            className={cn(
                              "p-6 rounded-[2rem] border transition-all duration-300 text-left flex flex-col justify-between relative overflow-hidden group bg-white shadow-xl shadow-slate-200/40",
                              isSelected
                                ? "border-blue-600 bg-blue-50/40 ring-4 ring-blue-500/10 shadow-blue-500/10 scale-[1.02]"
                                : "border-slate-100 hover:border-slate-200 hover:scale-[1.01]"
                            )}
                          >
                            <div className="space-y-2">
                              <div className="flex justify-between items-start gap-2">
                                <span className="font-black text-slate-900 text-base uppercase tracking-tight group-hover:text-blue-600 transition-colors line-clamp-1">
                                  {p.name}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider line-clamp-2">
                                {p.description || p.name}
                              </p>
                            </div>

                            <div className="pt-4 mt-4 border-t border-slate-100 flex justify-between items-center w-full">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                Harga
                              </span>
                              <span className="font-black text-lg text-slate-900 font-mono tracking-tight group-hover:text-blue-600 transition-colors">
                                Rp {Number(p.catalog_price).toLocaleString("id-ID")}
                              </span>
                            </div>

                            {isSelected && (
                              <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-blue-600" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Area: Order Summary & Checkout Card */}
            <div className="lg:col-span-4 sticky top-6">
              <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-slate-200/60 border border-slate-100 space-y-6">
                <div className="flex items-center gap-3 pb-6 border-b border-slate-100">
                  <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                    <Receipt className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">
                      Ringkasan Kasir
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Konfirmasi Sebelum Eksekusi
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                      Layanan
                    </span>
                    <span className="font-black text-slate-800">
                      {CATEGORIES.find((c) => c.id === selectedCategory)?.name}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                      Nomor Tujuan
                    </span>
                    <span className="font-black text-blue-600 font-mono text-sm">
                      {customerTarget || "-"}
                    </span>
                  </div>

                  {selectedCategory === "PLN_TOKEN" && plnSubscriber && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                        Nama Pelanggan
                      </span>
                      <span className="font-black text-slate-800 uppercase truncate max-w-[150px]">
                        {plnSubscriber.name}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                      Item Produk
                    </span>
                    <span className="font-black text-slate-800 text-right max-w-[180px] truncate">
                      {inquiryResult
                        ? `${inquiryResult.category} (${inquiryResult.customer_name})`
                        : selectedProduct
                        ? selectedProduct.name
                        : "-"}
                    </span>
                  </div>

                  <div className="h-px bg-slate-100 my-2" />

                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                      Harga Produk / Tagihan
                    </span>
                    <span className="font-bold text-slate-800 font-mono">
                      Rp{" "}
                      {inquiryResult
                        ? Number(inquiryResult.final_price).toLocaleString("id-ID")
                        : selectedProduct
                        ? Number(selectedProduct.catalog_price).toLocaleString("id-ID")
                        : "0"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                      Biaya Layanan
                    </span>
                    <span className="font-bold text-emerald-600 font-mono">
                      Rp 0 (HPP)
                    </span>
                  </div>

                  <div className="h-px bg-slate-100 my-2" />

                  <div className="flex justify-between items-center pt-2">
                    <span className="font-black text-slate-900 text-sm uppercase tracking-tight">
                      Total Bayar
                    </span>
                    <span className="text-2xl font-black text-emerald-600 font-mono tracking-tight">
                      Rp{" "}
                      {inquiryResult
                        ? Number(inquiryResult.final_price).toLocaleString("id-ID")
                        : selectedProduct
                        ? Number(selectedProduct.catalog_price).toLocaleString("id-ID")
                        : "0"}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={() => setConfirmModalOpen(true)}
                  disabled={
                    isProcessing ||
                    !customerTarget ||
                    (!inquiryResult && !selectedProduct)
                  }
                  className="w-full premium-gradient text-white h-16 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
                >
                  <span>Proses Transaksi</span>
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RIWAYAT TRANSAKSI TOPUP */}
      {activeTab === "history" && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="bg-white/50 backdrop-blur-md rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-white p-6">
            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
              <div className="flex flex-wrap items-center gap-3 flex-1">
                <div className="relative min-w-[260px] flex-1">
                  <Search className="h-5 w-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                  <Input
                    type="text"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && fetchHistory()}
                    placeholder="Cari nomor / ref / serial..."
                    className="pl-14 h-14 bg-white border-slate-100 shadow-sm text-sm rounded-[1.5rem] font-bold"
                  />
                </div>

                <select
                  value={historyFilterCategory}
                  onChange={(e) => setHistoryFilterCategory(e.target.value)}
                  className="h-14 px-6 rounded-[1.5rem] bg-white border border-slate-100 shadow-sm font-bold text-slate-700 text-xs focus:outline-none"
                >
                  <option value="ALL">Semua Kategori</option>
                  <option value="PULSA">Pulsa</option>
                  <option value="PAKET_DATA">Paket Data</option>
                  <option value="EMONEY">E-Money</option>
                  <option value="PLN_TOKEN">Token PLN</option>
                  <option value="INTERNET_BILL">IndiHome</option>
                </select>

                <select
                  value={historyFilterStatus}
                  onChange={(e) => setHistoryFilterStatus(e.target.value)}
                  className="h-14 px-6 rounded-[1.5rem] bg-white border border-slate-100 shadow-sm font-bold text-slate-700 text-xs focus:outline-none"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="SUCCESS">SUCCESS</option>
                  <option value="PENDING">PENDING</option>
                  <option value="FAILED">FAILED</option>
                </select>
              </div>

              <Button
                onClick={fetchHistory}
                className="premium-gradient text-white h-14 px-8 rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-500/20"
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", loadingHistory && "animate-spin")} />
                <span>Segarkan</span>
              </Button>
            </div>
          </div>

          {/* Transactions Table Card */}
          <Card className="border-none shadow-2xl shadow-slate-200/60 overflow-hidden rounded-[2.5rem] bg-white group">
            <CardContent className="p-0">
              <div className="overflow-x-auto no-scrollbar overflow-y-auto max-h-[700px]">
                <Table>
                  <TableHeader className="bg-slate-50/80 sticky top-0 z-20 backdrop-blur-md border-b border-slate-100">
                    <TableRow>
                      <TableHead className="py-8 pl-10 font-black uppercase tracking-widest text-[10px] text-slate-400">
                        Waktu / Referensi
                      </TableHead>
                      <TableHead className="font-black uppercase tracking-widest text-[10px] text-slate-400">
                        Layanan & Produk
                      </TableHead>
                      <TableHead className="font-black uppercase tracking-widest text-[10px] text-slate-400">
                        Nomor Tujuan
                      </TableHead>
                      <TableHead className="font-black uppercase tracking-widest text-[10px] text-slate-400 text-right">
                        Harga Final
                      </TableHead>
                      <TableHead className="font-black uppercase tracking-widest text-[10px] text-slate-400 text-center">
                        Status
                      </TableHead>
                      <TableHead className="font-black uppercase tracking-widest text-[10px] text-slate-400">
                        Serial / Token
                      </TableHead>
                      <TableHead className="font-black uppercase tracking-widest text-[10px] text-slate-400 text-center pr-10">
                        Aksi
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingHistory ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i} className="border-slate-50">
                          <TableCell colSpan={7} className="py-8 px-10">
                            <div className="w-full h-12 bg-slate-50 rounded-2xl animate-pulse" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : historyList.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-[400px] text-center">
                          <div className="flex flex-col items-center justify-center gap-4 text-slate-300">
                            <Receipt className="h-16 w-16 opacity-20" />
                            <p className="text-xl font-black text-slate-400 uppercase tracking-tight">
                              Belum ada transaksi
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      historyList.map((item) => {
                        const isSuccess = item.status === "SUCCESS";
                        const isPending = item.status === "PENDING" || item.status === "SUBMITTED";

                        return (
                          <TableRow key={item.reference} className="hover:bg-slate-50/50 transition-all border-slate-50">
                            <TableCell className="py-6 pl-10">
                              <div className="font-black text-slate-800 text-sm font-mono uppercase tracking-tight">
                                {item.reference}
                              </div>
                              <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                                {new Date(item.created_at).toLocaleString("id-ID", {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                })}
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="font-black text-slate-800 text-base uppercase tracking-tight">
                                {item.product_snapshot?.name || item.category}
                              </div>
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 py-0.5 bg-slate-100 rounded-lg">
                                {item.category}
                              </span>
                            </TableCell>

                            <TableCell>
                              <span className="font-black text-blue-600 font-mono text-sm">
                                {item.customer_target}
                              </span>
                            </TableCell>

                            <TableCell className="text-right">
                              <span className="text-lg font-black text-emerald-600 font-mono">
                                Rp {Number(item.final_price).toLocaleString("id-ID")}
                              </span>
                            </TableCell>

                            <TableCell className="text-center">
                              {isSuccess ? (
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm">
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  <span className="text-[9px] font-black uppercase tracking-widest">SUCCESS</span>
                                </div>
                              ) : isPending ? (
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-100 shadow-sm">
                                  <Clock className="w-3 h-3 text-amber-500 animate-spin" />
                                  <span className="text-[9px] font-black uppercase tracking-widest">PENDING</span>
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-100 shadow-sm">
                                  <span className="text-[9px] font-black uppercase tracking-widest">FAILED</span>
                                </div>
                              )}
                            </TableCell>

                            <TableCell className="font-mono text-xs font-bold text-slate-700">
                              {item.token ? (
                                <span className="text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                                  {item.token}
                                </span>
                              ) : item.serial_number ? (
                                item.serial_number
                              ) : (
                                "-"
                              )}
                            </TableCell>

                            <TableCell className="text-center pr-10">
                              <div className="flex items-center justify-center gap-2">
                                {isPending && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleCheckStatus(item.reference)}
                                    disabled={checkingStatusRef === item.reference}
                                    className="bg-amber-500 hover:bg-amber-600 text-white font-black text-[10px] uppercase tracking-widest h-9 px-3 rounded-xl shadow-sm"
                                  >
                                    <RefreshCw className={cn("h-3 w-3 mr-1", checkingStatusRef === item.reference && "animate-spin")} />
                                    Cek Status
                                  </Button>
                                )}

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setLastTransaction(item);
                                    setReceiptModalOpen(true);
                                  }}
                                  className="h-9 px-4 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 font-black text-[10px] uppercase tracking-widest"
                                >
                                  <Eye className="h-3.5 w-3.5 mr-1" />
                                  Struk
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="p-6 border-t border-slate-100 flex justify-between items-center text-xs font-bold text-slate-400">
                <span>Total: {historyPagination.total} Transaksi</span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={historyPage <= 1}
                    onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                    className="h-9 px-4 rounded-xl border-slate-100 font-bold"
                  >
                    Sebelumnya
                  </Button>
                  <span className="px-3 py-2 font-black text-slate-800">
                    Hal {historyPage} dari {historyPagination.totalPages || 1}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={historyPage >= historyPagination.totalPages}
                    onClick={() => setHistoryPage((p) => p + 1)}
                    className="h-9 px-4 rounded-xl border-slate-100 font-bold"
                  >
                    Selanjutnya
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: ADMIN KELOLA KATALOG */}
      {activeTab === "admin_import" && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white/50 backdrop-blur-md rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-white p-10 space-y-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                <FileSpreadsheet className="h-7 w-7 text-blue-600" />
                <span>Impor & Sinkronisasi Katalog Topup</span>
              </h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                Unggah file CSV katalog (Format 2-skema daftar-produk.csv).
              </p>
            </div>

            <div className="border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-[2rem] p-10 text-center transition-all bg-white">
              <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-base font-black text-slate-800 uppercase tracking-tight mb-1">
                Pilih File CSV Katalog
              </p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
                Mendukung TSV / CSV delimiter tab atau koma
              </p>
              <input
                type="file"
                accept=".csv,.tsv,.txt"
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                className="text-xs text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-xs file:font-black file:uppercase file:tracking-widest file:bg-blue-600 file:text-white hover:file:bg-blue-700"
              />
            </div>

            <Button
              onClick={handleUploadCsv}
              disabled={!csvFile || importing}
              className="w-full premium-gradient text-white h-16 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-500/20"
            >
              {importing ? <RefreshCw className="h-5 w-5 animate-spin mr-2" /> : <Upload className="h-5 w-5 mr-2" />}
              <span>{importing ? "Sedang Mengimpor Data..." : "Unggah & Proses Katalog"}</span>
            </Button>

            {importResult && (
              <div
                className={cn(
                  "p-6 rounded-[2rem] border animate-in zoom-in-95",
                  importResult.success
                    ? "bg-emerald-50 border-emerald-100 text-emerald-900"
                    : "bg-rose-50 border-rose-100 text-rose-900"
                )}
              >
                <div className="font-black text-sm uppercase tracking-tight flex items-center gap-2">
                  {importResult.success ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <XCircle className="h-5 w-5 text-rose-600" />}
                  <span>{importResult.message || (importResult.success ? "Impor Berhasil" : "Impor Gagal")}</span>
                </div>
                {importResult.data && (
                  <div className="grid grid-cols-3 gap-4 pt-4 text-xs font-bold uppercase tracking-wider">
                    <div>Total: {importResult.data.totalRows} Baris</div>
                    <div>Diterima: {importResult.data.acceptedCount}</div>
                    <div>Diabaikan: {importResult.data.rejectedCount}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG MODAL */}
      <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-[3rem] p-8 bg-white border-none shadow-2xl space-y-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-900 uppercase tracking-tight">
              Konfirmasi Transaksi
            </DialogTitle>
            <DialogDescription className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Pastikan nomor tujuan dan nominal sudah benar sebelum memproses ke supplier.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-slate-50 p-6 rounded-[2rem] space-y-4 text-xs font-bold">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 uppercase tracking-widest text-[10px]">Layanan:</span>
              <span className="text-slate-900 uppercase">{selectedCategory}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 uppercase tracking-widest text-[10px]">Nomor Tujuan:</span>
              <span className="text-blue-600 font-mono text-sm font-black">{customerTarget}</span>
            </div>
            {inquiryResult?.customer_name && (
              <div className="flex justify-between items-center">
                <span className="text-slate-400 uppercase tracking-widest text-[10px]">Nama Pelanggan:</span>
                <span className="text-slate-900 uppercase">{inquiryResult.customer_name}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-slate-400 uppercase tracking-widest text-[10px]">Produk:</span>
              <span className="text-slate-900 uppercase text-right max-w-[200px] truncate font-black">
                {inquiryResult ? inquiryResult.category : selectedProduct?.name}
              </span>
            </div>
            <div className="h-px bg-slate-200" />
            <div className="flex justify-between items-center pt-2">
              <span className="text-slate-900 font-black uppercase text-sm">Total Bayar:</span>
              <span className="text-2xl font-black text-emerald-600 font-mono">
                Rp{" "}
                {inquiryResult
                  ? Number(inquiryResult.final_price).toLocaleString("id-ID")
                  : selectedProduct
                  ? Number(selectedProduct.catalog_price).toLocaleString("id-ID")
                  : "0"}
              </span>
            </div>
          </div>

          <DialogFooter className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setConfirmModalOpen(false)}
              className="flex-1 h-14 rounded-2xl border-slate-200 font-black text-xs uppercase tracking-widest"
            >
              Batal
            </Button>
            <Button
              onClick={inquiryResult ? handleProcessPostpaid : handleProcessPrepaid}
              disabled={isProcessing}
              className="flex-1 h-14 rounded-2xl premium-gradient text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20"
            >
              {isProcessing ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
              <span>{isProcessing ? "Memproses..." : "Ya, Bayar"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* STANDARDIZED RECEIPT MODAL (Matching PLN & Orbit) */}
      <TopupReceiptModal
        open={receiptModalOpen}
        onOpenChange={setReceiptModalOpen}
        transaction={lastTransaction}
      />
    </div>
  );
}
