"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Wallet, 
  Smartphone, 
  Search, 
  Loader2, 
  CheckCircle2, 
  XCircle,
  TrendingUp,
  CreditCard,
  Zap,
  Ticket
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getPriceList } from "@/services/digiflazz";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const EMONEY_BRANDS = [
  { id: "dana", name: "DANA", color: "bg-blue-500", icon: Wallet },
  { id: "gopay", name: "GO-PAY", color: "bg-emerald-500", icon: TrendingUp },
  { id: "ovo", name: "OVO", color: "bg-purple-600", icon: CreditCard },
  { id: "shopeepay", name: "SHOPEEPAY", color: "bg-orange-600", icon: Ticket },
];

export default function EmoneyPage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  
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

  const fetchProducts = async () => {
    setLoading(true);
    const json = await getPriceList();
    if (json.success) {
      setProducts(json.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    if (!selectedBrand) return [];
    return products.filter(p => 
      p.brand.toLowerCase() === selectedBrand.toLowerCase() && 
      p.buyer_product_status && 
      p.seller_product_status
    ).sort((a, b) => a.price - b.price);
  }, [products, selectedBrand]);

  const handlePurchase = async () => {
    if (!selectedProduct || !phoneNumber) return;
    
    setProcessing(true);
    try {
      const res = await fetch("/api/trx/emoney", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone_number: phoneNumber,
          sku: selectedProduct.buyer_sku_code,
          brand: selectedProduct.brand,
          product_name: selectedProduct.product_name,
        }),
      });
      
      const json = await res.json();
      if (json.success) {
        setAlertConfig({
          open: true,
          type: "success",
          title: "Transaksi Berhasil",
          message: `Pembelian ${selectedProduct.product_name} untuk ${phoneNumber} sedang diproses.`,
        });
        setPhoneNumber("");
        setSelectedProduct(null);
      } else {
        setAlertConfig({
          open: true,
          type: "error",
          title: "Transaksi Gagal",
          message: json.error || "Terjadi kesalahan saat memproses transaksi.",
        });
      }
    } catch (err) {
      setAlertConfig({
        open: true,
        type: "error",
        title: "Kesalahan Sistem",
        message: "Tidak dapat terhubung ke server.",
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-slide-in-bottom pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 flex items-center gap-4">
            <div className="p-3 premium-gradient rounded-2xl shadow-xl shadow-blue-500/20">
              <Wallet className="h-8 w-8 text-white" />
            </div>
            <span className="text-gradient">Top Up E-Money</span>
          </h1>
          <p className="text-slate-500 mt-3 font-bold text-sm uppercase tracking-widest pl-1 border-l-4 border-blue-500 ml-1">
            Wallet & Digital Balance • Automated Instant Transfer
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input Form */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] bg-white overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
              <CardTitle className="text-xl font-black text-slate-800">Nomor Tujuan</CardTitle>
              <CardDescription className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Input Phone Number for Top Up</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-3">
                <Label htmlFor="phoneNumber" className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Nomor Handphone</Label>
                <div className="relative group">
                  <Input 
                    id="phoneNumber"
                    type="tel"
                    placeholder="0812XXXXXXXX"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="h-16 pl-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-black text-xl tracking-widest"
                  />
                  <Smartphone className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Pilih Provider</Label>
                <div className="grid grid-cols-2 gap-3">
                  {EMONEY_BRANDS.map((brand) => (
                    <button
                      key={brand.id}
                      onClick={() => setSelectedBrand(brand.id)}
                      className={cn(
                        "flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border transition-all duration-300",
                        selectedBrand === brand.id 
                          ? "bg-white border-blue-500 shadow-xl shadow-blue-500/10 scale-[1.02]" 
                          : "bg-slate-50/50 border-slate-100 hover:border-blue-200 grayscale opacity-60 hover:grayscale-0 hover:opacity-100"
                      )}
                    >
                      <div className={cn("p-3 rounded-xl text-white shadow-lg", brand.color)}>
                        <brand.icon className="h-6 w-6" />
                      </div>
                      <span className="font-black text-[10px] uppercase tracking-widest text-slate-600">{brand.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Nominal Selection */}
        <div className="lg:col-span-8 space-y-6">
          {!selectedBrand ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center gap-6 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[2.5rem]">
              <div className="p-8 bg-white rounded-full shadow-xl shadow-slate-200/50">
                <Search className="h-16 w-16 text-slate-200" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-black text-slate-400 uppercase tracking-tight">Pilih Provider Terlebih Dahulu</h3>
                <p className="text-sm font-bold text-slate-300 uppercase tracking-widest">Silakan pilih provider e-money untuk melihat daftar nominal</p>
              </div>
            </div>
          ) : loading ? (
            <div className="h-full min-h-[400px] flex items-center justify-center">
              <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
               <div className="flex items-center justify-between px-4">
                  <h3 className="text-xl font-black text-slate-800 flex items-center gap-3 uppercase tracking-tight">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    Pilih Nominal {selectedBrand.toUpperCase()}
                  </h3>
                  <Badge className="bg-blue-50 text-blue-600 border-blue-100 font-black px-4 py-1.5 rounded-full uppercase text-[10px] tracking-widest">
                    {filteredProducts.length} Produk Tersedia
                  </Badge>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <Card 
                    key={product.buyer_sku_code} 
                    className={cn(
                      "border-none shadow-xl hover:shadow-2xl transition-all duration-500 rounded-[2rem] overflow-hidden cursor-pointer group relative",
                      selectedProduct?.buyer_sku_code === product.buyer_sku_code ? "ring-4 ring-blue-500 ring-offset-4" : ""
                    )}
                    onClick={() => setSelectedProduct(product)}
                  >
                    <CardContent className="p-6 flex flex-col items-center space-y-4">
                       <div className="flex flex-col items-center">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{selectedBrand}</span>
                          <span className="text-2xl font-black text-slate-900 tracking-tighter">
                            {product.product_name.replace(selectedBrand.toUpperCase(), "").trim()}
                          </span>
                       </div>
                       
                       <div className="w-full h-px bg-slate-100" />
                       
                       <div className="text-center space-y-1">
                          <p className="text-2xl font-black text-emerald-600 tabular-nums">
                            Rp {Number(product.price).toLocaleString("id-ID")}
                          </p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Harga Realtime</p>
                       </div>

                       <Button 
                          className={cn(
                            "w-full h-12 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all",
                            selectedProduct?.buyer_sku_code === product.buyer_sku_code 
                              ? "premium-gradient text-white shadow-lg shadow-blue-500/20" 
                              : "bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:shadow-md"
                          )}
                       >
                          {selectedProduct?.buyer_sku_code === product.buyer_sku_code ? "Terpilih" : "Pilih Nominal"}
                       </Button>
                    </CardContent>
                  </Card>
                ))}
               </div>

               {selectedProduct && (
                 <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-lg px-8 z-50 animate-in slide-in-from-bottom-10 duration-500">
                    <Card className="premium-gradient p-1.5 rounded-[2.5rem] shadow-2xl shadow-blue-600/30">
                       <div className="bg-white/10 backdrop-blur-md rounded-[2.3rem] p-6 flex items-center justify-between text-white">
                          <div className="flex flex-col">
                             <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">Total Pembayaran</span>
                             <span className="text-2xl font-black tabular-nums">Rp {Number(selectedProduct.price).toLocaleString("id-ID")}</span>
                          </div>
                          
                          <Button 
                            onClick={handlePurchase}
                            disabled={processing}
                            className="bg-white text-blue-600 hover:bg-blue-50 h-14 px-10 rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all flex items-center gap-3"
                          >
                            {processing ? <Loader2 className="h-5 w-5 animate-spin" /> : "PROSES SEKARANG"}
                          </Button>
                       </div>
                    </Card>
                 </div>
               )}
            </div>
          )}
        </div>
      </div>

      {/* Alert Modal */}
      <Dialog open={alertConfig.open} onOpenChange={(open) => setAlertConfig(prev => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-[400px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <div className={cn(
            "p-8 text-center space-y-4",
            alertConfig.type === "success" ? "bg-emerald-50" : "bg-rose-50"
          )}>
            <div className={cn(
              "h-20 w-20 rounded-full mx-auto flex items-center justify-center animate-in zoom-in duration-300",
              alertConfig.type === "success" ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
            )}>
              {alertConfig.type === "success" ? (
                <CheckCircle2 className="h-12 w-12" />
              ) : (
                <XCircle className="h-12 w-12" />
              )}
            </div>
            
            <div className="space-y-2">
              <DialogTitle className="text-2xl font-black text-slate-800">{alertConfig.title}</DialogTitle>
              <DialogDescription className="text-sm font-bold text-slate-500 leading-relaxed px-4">
                {alertConfig.message}
              </DialogDescription>
            </div>
          </div>

          <div className="p-6 bg-white flex justify-center">
            <Button 
              onClick={() => setAlertConfig(prev => ({ ...prev, open: false }))}
              className={cn(
                "w-full h-14 rounded-2xl font-black uppercase text-xs tracking-widest text-white shadow-xl transition-all active:scale-95",
                alertConfig.type === "success" ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20" : "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20"
              )}
            >
              MENGGERTI
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
