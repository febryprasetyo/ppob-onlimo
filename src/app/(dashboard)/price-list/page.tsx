"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, RefreshCw, AlertCircle, Database, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getPriceList, syncPriceList } from "@/services/digiflazz";

export default function PriceListPage() {
  const [prices, setPrices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  
  // States for Filtering
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);

  const fetchPrices = async () => {
    setLoading(true);
    setError(null);
    const json = await getPriceList();
    if (json.success) {
      setPrices(json.data);
    } else {
      setError(json.message || "Gagal memuat daftar harga");
      setPrices([]);
    }
    setLoading(false);
  };

  const handleUpdateData = async () => {
    setSyncing(true);
    setError(null);
    const json = await syncPriceList();
    if (json.success) {
      await fetchPrices();
      alert(json.message || "Data berhasil diperbarui");
    } else {
      setError(json.message || "Gagal memperbarui data dari Digiflazz");
    }
    setSyncing(false);
  };

  useEffect(() => {
    fetchPrices();
  }, []);

  // Extract Categories uniquely
  const categories = useMemo(() => {
    const list = Array.from(new Set(prices.map((p) => p.category)));
    return list.sort();
  }, [prices]);

  // Extract Brands based on selected category
  const brands = useMemo(() => {
    if (!selectedCategory) return [];
    const list = Array.from(
      new Set(
        prices
          .filter((p) => p.category === selectedCategory)
          .map((p) => p.brand)
      )
    );
    return list.sort();
  }, [prices, selectedCategory]);

  const filteredPrices = useMemo(() => {
    return prices.filter((p) => {
      const matchSearch = (p.product_name?.toLowerCase().includes(search.toLowerCase()) || "") ||
                         (p.buyer_sku_code?.toLowerCase().includes(search.toLowerCase()) || "");
      const matchCategory = selectedCategory ? p.category === selectedCategory : true;
      const matchBrand = selectedBrand ? p.brand === selectedBrand : true;
      
      return matchSearch && matchCategory && matchBrand;
    });
  }, [prices, search, selectedCategory, selectedBrand]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedBrand(null);
    setSearch("");
  };

  return (
    <div className="space-y-8 animate-slide-in-bottom pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 flex items-center gap-4">
            <div className="p-3 premium-gradient rounded-2xl shadow-xl shadow-blue-500/20">
              <Database className="h-8 w-8 text-white" />
            </div>
            <span className="text-gradient">Daftar Harga Produk</span>
          </h1>
          <p className="text-slate-500 mt-3 font-bold text-sm uppercase tracking-widest pl-1 border-l-4 border-blue-500 ml-1">
            Product Database • Digiflazz Realtime Rates
          </p>
        </div>
        
        <Button 
          variant="default" 
          onClick={handleUpdateData} 
          disabled={syncing || loading}
          className="premium-gradient hover:opacity-95 text-white shadow-xl shadow-blue-500/20 transition-all active:scale-95 h-16 rounded-2xl px-10 font-black uppercase text-xs tracking-widest flex gap-3"
        >
          <RefreshCw className={cn("h-5 w-5", syncing && "animate-spin")} />
          {syncing ? "SINKRONISASI..." : "Update dari Digiflazz"}
        </Button>
      </div>

      {/* Modern Filtering Interface */}
      <div className="bg-white/50 backdrop-blur-md rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-white p-2 space-y-2">
        {/* Search Input Filter */}
        <div className="relative group p-2">
          <Input
            placeholder="Cari produk atau SKU..."
            className="pl-14 h-16 bg-white border-slate-100 shadow-sm focus-visible:ring-4 focus-visible:ring-blue-500/5 text-lg rounded-[1.8rem] transition-all font-bold placeholder:text-slate-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search className="absolute left-8 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
        </div>

        {/* Category Tabs */}
        <div className="flex overflow-x-auto no-scrollbar p-2 gap-2">
          <button
            onClick={() => { setSelectedCategory(null); setSelectedBrand(null); }}
            className={cn(
              "px-8 py-4 rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-500 border",
              !selectedCategory 
                ? "bg-white text-blue-600 shadow-lg border-white ring-4 ring-blue-500/5" 
                : "text-slate-400 hover:text-slate-600 border-transparent hover:bg-white/50"
            )}
          >
            Semua Satuan
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => { setSelectedCategory(cat); setSelectedBrand(null); }}
              className={cn(
                "px-8 py-4 rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-500 border",
                selectedCategory === cat 
                  ? "bg-white text-blue-600 shadow-lg border-white ring-4 ring-blue-500/5" 
                  : "text-slate-400 hover:text-slate-600 border-transparent hover:bg-white/50"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Brand Horizontal Tags (Visible if Category Selected) */}
        {selectedCategory && (
          <div className="flex flex-wrap items-center gap-2 p-4 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
            {brands.map((brand) => (
              <button
                key={brand}
                onClick={() => setSelectedBrand(selectedBrand === brand ? null : brand)}
                className={cn(
                  "px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border",
                  selectedBrand === brand
                    ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20 scale-105"
                    : "bg-white text-slate-400 border-slate-100 hover:bg-blue-50 hover:text-blue-600"
                )}
              >
                {brand}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filter Stats & Reset */}
      {(selectedCategory || selectedBrand || search) && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Filters:</span>
            {selectedCategory && (
              <Badge variant="secondary" className="bg-blue-600 text-white border-none font-black uppercase text-[9px] tracking-widest px-3 py-1 rounded-lg">
                {selectedCategory}
              </Badge>
            )}
            {selectedBrand && (
              <Badge variant="secondary" className="bg-indigo-600 text-white border-none font-black uppercase text-[9px] tracking-widest px-3 py-1 rounded-lg">
                {selectedBrand}
              </Badge>
            )}
            {search && (
              <Badge variant="secondary" className="bg-slate-900 text-white border-none font-black uppercase text-[9px] tracking-widest px-3 py-1 rounded-lg">
                "{search}"
              </Badge>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearFilters}
            className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 font-black uppercase text-[10px] tracking-widest flex items-center gap-2 h-10 px-4 rounded-xl transition-all"
          >
            <X className="h-4 w-4" />
            Hapus Filter
          </Button>
        </div>
      )}

      {/* Error / Alert Section */}
      {error && (
        <div className="p-6 rounded-[2rem] bg-amber-50 text-amber-900 border border-amber-100 flex items-center gap-4 shadow-xl shadow-amber-900/5 animate-in zoom-in-95 duration-300">
          <div className="p-3 bg-white rounded-2xl shadow-sm">
            <AlertCircle className="h-6 w-6 text-amber-500" />
          </div>
          <p className="text-sm font-black uppercase tracking-tight">{error}</p>
        </div>
      )}

      {/* Data Table Section */}
      <Card className="border-none shadow-2xl shadow-slate-200/60 overflow-hidden rounded-[2.5rem] bg-white group">
        <CardContent className="p-0">
          <div className="overflow-x-auto no-scrollbar overflow-y-auto max-h-[700px]">
            <Table>
              <TableHeader className="bg-slate-50/80 sticky top-0 z-20 backdrop-blur-md border-b border-slate-100">
                <TableRow>
                  <TableHead className="py-8 pl-10 font-black uppercase tracking-widest text-[10px] text-slate-400">Informasi Produk</TableHead>
                  <TableHead className="font-black uppercase tracking-widest text-[10px] text-slate-400">Brand Provider</TableHead>
                  <TableHead className="font-black uppercase tracking-widest text-[10px] text-slate-400 text-center">SKU Identity</TableHead>
                  <TableHead className="text-right pr-10 font-black uppercase tracking-widest text-[10px] text-slate-400">Harga (HPP)</TableHead>
                  <TableHead className="font-black uppercase tracking-widest text-[10px] text-slate-400 text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && !syncing ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i} className="border-slate-50">
                      <TableCell colSpan={5} className="py-10 px-10">
                        <div className="w-full h-16 bg-slate-50 rounded-3xl animate-pulse" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredPrices.length > 0 ? (
                  filteredPrices.map((product: any, idx: number) => (
                    <TableRow key={idx} className="group hover:bg-slate-50/50 transition-all border-slate-50">
                      <TableCell className="py-6 pl-10">
                        <div className="font-black text-slate-800 text-lg uppercase tracking-tight group-hover:text-blue-600 transition-colors leading-tight">{product.product_name}</div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 py-0.5 bg-slate-100 rounded-lg">{product.category}</span>
                          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{product.type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest group-hover:scale-105 transition-transform origin-left">{product.brand}</span>
                          <span className="text-[9px] text-slate-300 font-bold uppercase mt-0.5 tracking-tighter">Official Provider</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <code className="bg-slate-100 text-slate-400 group-hover:bg-slate-900 group-hover:text-white px-4 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all">
                          {product.buyer_sku_code}
                        </code>
                      </TableCell>
                      <TableCell className="text-right pr-10">
                        <div className="flex flex-col items-end">
                          <span className="text-xl font-black text-slate-900 tabular-nums tracking-tighter group-hover:text-blue-600 transition-colors">{formatPrice(product.price)}</span>
                          <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">Realtime Rate</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {product.buyer_product_status && product.seller_product_status ? (
                          <div className="flex flex-col items-center gap-2">
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-[9px] font-black uppercase tracking-widest">Active</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 opacity-60">
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-100">
                              <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              <span className="text-[9px] font-black uppercase tracking-widest">Offline</span>
                            </div>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-[500px] text-center">
                      <div className="flex flex-col items-center justify-center gap-6 text-slate-300">
                        <div className="p-8 rounded-[3rem] bg-slate-50">
                          <Database className="h-20 w-20 opacity-20" />
                        </div>
                        <div className="space-y-2">
                          <p className="text-2xl font-black text-slate-400 uppercase tracking-tighter">Data Tidak Ditemukan</p>
                          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest opacity-60">Coba sesuaikan filter pencarian Anda</p>
                        </div>
                        <Button variant="outline" onClick={clearFilters} className="h-14 px-8 rounded-2xl border-slate-100 font-black uppercase text-[10px] tracking-widest transition-all hover:bg-slate-50">Reset Filter</Button>
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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-slate-300 font-black uppercase tracking-[0.4em] px-8">
        <div className="flex items-center gap-4">
          <span className="text-slate-400">Total Produk Aktif: {filteredPrices.length}</span>
          <div className="h-4 w-[1px] bg-slate-100" />
          <span>Last Sync: {new Date().toLocaleTimeString()}</span>
        </div>
        <span className="flex items-center gap-3">
          Onlimo Core v1.0.4
          <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
        </span>
      </div>
    </div>
  );
}
