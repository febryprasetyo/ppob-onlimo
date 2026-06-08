"use client";

import { useRef, useState } from "react";
import { Receipt, Download, Loader2, Search, Filter, Zap, Wifi } from "lucide-react";
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
}

interface StrukClientProps {
  dataPln: TrxData[];
  dataOrbit: TrxData[];
}

export function StrukClient({ dataPln, dataOrbit }: StrukClientProps) {
  const [activeTab, setActiveTab] = useState<"pln" | "orbit">("pln");
  const data = activeTab === "pln" ? dataPln : dataOrbit;

  const receiptRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [selectedTrx, setSelectedTrx] = useState<TrxData | null>(null);
  const [search, setSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState("all");

  const availableMonths = Array.from(
    new Set(
      data.map((trx) => {
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

  const filteredData = data.filter((trx) => {
    const idNum = trx.meter_number || trx.phone_number || "";
    const matchesSearch =
      trx.nama_stasiun.toLowerCase().includes(search.toLowerCase()) ||
      idNum.includes(search);

    let matchesMonth = true;
    if (monthFilter !== "all") {
      const trxDate = new Date(trx.created_at);
      const trxMonthYear = `${trxDate.getFullYear()}-${String(trxDate.getMonth() + 1).padStart(2, "0")}`;
      matchesMonth = trxMonthYear === monthFilter;
    }

    return matchesSearch && matchesMonth;
  });

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
          </div>
        </div>
      </div>
      
      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:max-w-full, .print\\:max-w-full * {
            visibility: visible;
          }
          .print\\:max-w-full {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
        }
      `}} />
    </div>
  );
}
