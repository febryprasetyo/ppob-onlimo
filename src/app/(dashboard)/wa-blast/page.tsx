"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Send,
  Users,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Search,
  Zap,
  Wifi,
  Sparkles,
  RefreshCw,
  Clock,
  Check,
  XCircle,
  FileText,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  PhoneCall,
  CheckSquare,
  Square,
  Copy,
  Info
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface StationContact {
  id: string;
  nama_stasiun: string;
  operator_wa: string;
  meter_number?: string;
  phone_number?: string;
  provinsi?: string;
  kabupaten?: string;
  detail_lokasi?: string;
  keterangan?: string;
  has_pln?: boolean;
  has_orbit?: boolean;
}

interface SendResult {
  nama_stasiun: string;
  operator_wa: string;
  success: boolean;
  error?: string;
}

const TEMPLATES = [
  {
    title: "Pemeliharaan Rutin Stasiun",
    tag: "Maintenance",
    text: `Halo Rekan Operator {nama_stasiun},

Diberitahukan bahwa akan dilakukan pemeliharaan sistem rutin pada stasiun {nama_stasiun} ({detail_lokasi}) pada hari {tanggal}.

Mohon pastikan perangkat Onlimo tetap terhubung dan laporkan jika terdapat kendala operasional di lokasi.

Terima kasih atas kerja samanya.
Tim Operasional PPOB Onlimo`,
  },
  {
    title: "Pengingat Pengecekan Token & Orbit",
    tag: "Operasional",
    text: `Selamat siang Rekan Operator {nama_stasiun},

Diingatkan untuk melakukan pengecekan berkala terhadap status listrik PLN dan jaringan internet Orbit di stasiun {nama_stasiun}.

Detail Lokasi: {detail_lokasi}, {kabupaten}
Nomor ID PLN: {meter_number}
Nomor Orbit: {phone_number}

Jika ada kendala kwh meter atau konektivitas, mohon segera konfirmasi ke tim kami. Terima kasih.`,
  },
  {
    title: "Pemberitahuan Umum / Informasi Terkini",
    tag: "Pengumuman",
    text: `Halo Rekan Operator {nama_stasiun},

[TULIS PESAN PENGUMUMAN DI SINI]

Tanggal: {tanggal} ({waktu})
Lokasi: {nama_stasiun}

Terima kasih atas perhatian dan kerja samanya.
PPOB Onlimo System`,
  },
];

export default function WaBlastPage() {
  // Stepper State (1: Pesan, 2: Kontak, 3: Kirim)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Data states
  const [contacts, setContacts] = useState<StationContact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Message compose state
  const [message, setMessage] = useState<string>(TEMPLATES[0].text);
  const [delayMs, setDelayMs] = useState<number>(1200);

  // Search & Filter in Step 2
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "has_wa" | "no_wa">("all");

  // Sending progress states
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);
  const [currentSendingIndex, setCurrentSendingIndex] = useState<number>(-1);
  const [sendResults, setSendResults] = useState<SendResult[]>([]);
  const [sendingLogs, setSendingLogs] = useState<Array<{ text: string; time: string; type: "info" | "success" | "error" }>>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showFinishedModal, setShowFinishedModal] = useState(false);
  const [stopRequested, setStopRequested] = useState(false);
  const abortControllerRef = useRef<boolean>(false);

  // Fetch station contacts from assets
  const fetchContacts = async () => {
    setLoadingContacts(true);
    try {
      const res = await fetch("/api/wa-blast/contacts");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setContacts(json.data);
        // Default: select all contacts that have operator_wa
        const initialSelected = new Set<string>();
        json.data.forEach((c: StationContact) => {
          if (c.operator_wa && c.operator_wa.trim().length >= 6) {
            initialSelected.add(c.nama_stasiun);
          }
        });
        setSelectedIds(initialSelected);
      }
    } catch (err) {
      console.error("Failed to fetch station contacts", err);
    } finally {
      setLoadingContacts(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  // Filtered contacts for selection table
  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      const matchSearch =
        c.nama_stasiun.toLowerCase().includes(search.toLowerCase()) ||
        c.operator_wa.includes(search) ||
        (c.kabupaten && c.kabupaten.toLowerCase().includes(search.toLowerCase())) ||
        (c.detail_lokasi && c.detail_lokasi.toLowerCase().includes(search.toLowerCase()));

      if (!matchSearch) return false;

      const hasWa = Boolean(c.operator_wa && c.operator_wa.trim().length >= 6);
      if (filterType === "has_wa") return hasWa;
      if (filterType === "no_wa") return !hasWa;
      return true;
    });
  }, [contacts, search, filterType]);

  // Selected contacts objects
  const selectedContactsList = useMemo(() => {
    return contacts.filter((c) => selectedIds.has(c.nama_stasiun));
  }, [contacts, selectedIds]);

  // Contacts with valid WA among selected
  const validSelectedRecipients = useMemo(() => {
    return selectedContactsList.filter((c) => c.operator_wa && c.operator_wa.trim().length >= 6);
  }, [selectedContactsList]);

  // Handle single toggle
  const toggleContact = (stationName: string) => {
    const next = new Set(selectedIds);
    if (next.has(stationName)) {
      next.delete(stationName);
    } else {
      next.add(stationName);
    }
    setSelectedIds(next);
  };

  // Select all matching filter
  const handleSelectAll = () => {
    const next = new Set(selectedIds);
    filteredContacts.forEach((c) => {
      if (c.operator_wa && c.operator_wa.trim().length >= 6) {
        next.add(c.nama_stasiun);
      }
    });
    setSelectedIds(next);
  };

  // Deselect all matching filter
  const handleDeselectAll = () => {
    const next = new Set(selectedIds);
    filteredContacts.forEach((c) => {
      next.delete(c.nama_stasiun);
    });
    setSelectedIds(next);
  };

  // Insert tag to message
  const insertTag = (tag: string) => {
    setMessage((prev) => prev + " " + tag);
  };

  // Live preview message rendering
  const sampleContact = selectedContactsList[0] || contacts[0] || {
    nama_stasiun: "KLHK299",
    operator_wa: "087812345678",
    detail_lokasi: "Stasiun Onlimo KLHK299",
    kabupaten: "Sumbawa",
    meter_number: "532109876543",
    phone_number: "081298765432",
  };

  const previewMessage = useMemo(() => {
    const now = new Date();
    const tanggal = now.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const waktu =
      now.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }) + " WIB";

    return message
      .replace(/{nama_stasiun}/gi, sampleContact.nama_stasiun || "KLHK299")
      .replace(/{operator_wa}/gi, sampleContact.operator_wa || "0878XXXXXXXX")
      .replace(/{nomor_wa}/gi, sampleContact.operator_wa || "0878XXXXXXXX")
      .replace(/{meter_number}/gi, sampleContact.meter_number || "532109876543")
      .replace(/{phone_number}/gi, sampleContact.phone_number || "081298765432")
      .replace(/{detail_lokasi}/gi, sampleContact.detail_lokasi || "Lokasi Unit")
      .replace(/{kabupaten}/gi, sampleContact.kabupaten || "Kabupaten")
      .replace(/{tanggal}/gi, tanggal)
      .replace(/{waktu}/gi, waktu);
  }, [message, sampleContact]);

  // Execute WA Blast (Progressive iteration to prevent Gateway 504 Timeout)
  const startBlast = async () => {
    setShowConfirmModal(false);
    setIsSending(true);
    setStopRequested(false);
    abortControllerRef.current = false;
    setSendProgress(0);
    setCurrentSendingIndex(-1);
    setSendResults([]);
    setSendingLogs([]);

    const recipients = validSelectedRecipients.map((c) => ({
      nama_stasiun: c.nama_stasiun,
      operator_wa: c.operator_wa,
      meter_number: c.meter_number,
      phone_number: c.phone_number,
      detail_lokasi: c.detail_lokasi,
      kabupaten: c.kabupaten,
      provinsi: c.provinsi,
    }));

    const total = recipients.length;
    addLog(`Memulai pengiriman WA Blast ke ${total} stasiun...`, "info");

    const results: SendResult[] = [];
    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < total; i++) {
      if (abortControllerRef.current) {
        addLog(`Pengiriman dihentikan pada stasiun ke-${i + 1} dari ${total}.`, "info");
        break;
      }

      const item = recipients[i];
      setCurrentSendingIndex(i);
      addLog(`Mengirim (${i + 1}/${total}): ${item.nama_stasiun} (${item.operator_wa})...`, "info");

      try {
        const res = await fetch("/api/wa-blast/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipient: item,
            message,
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`HTTP ${res.status}: ${errText.substring(0, 100)}`);
        }

        const json = await res.json();
        if (json.success && json.result?.success) {
          results.push(json.result);
          successCount++;
          addLog(`✅ Terkirim: ${item.nama_stasiun} (${item.operator_wa})`, "success");
        } else {
          const errMsg = json.result?.error || json.error || "Gagal terkirim melalui server WAHA";
          results.push({
            nama_stasiun: item.nama_stasiun,
            operator_wa: item.operator_wa,
            success: false,
            error: errMsg,
          });
          failedCount++;
          addLog(`❌ Gagal: ${item.nama_stasiun} (${item.operator_wa}) - ${errMsg}`, "error");
        }
      } catch (err: any) {
        console.error(`Error sending to ${item.nama_stasiun}:`, err);
        results.push({
          nama_stasiun: item.nama_stasiun,
          operator_wa: item.operator_wa,
          success: false,
          error: err.message || "Kesalahan jaringan",
        });
        failedCount++;
        addLog(`❌ Gagal: ${item.nama_stasiun} - ${err.message}`, "error");
      }

      // Live update results & progress bar
      const currentProgress = Math.round(((i + 1) / total) * 100);
      setSendProgress(currentProgress);
      setSendResults([...results]);

      // Safe delay before sending next recipient
      if (i < total - 1 && delayMs > 0 && !abortControllerRef.current) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    setIsSending(false);
    setCurrentSendingIndex(-1);
    addLog(
      `Broadcast selesai! Berhasil: ${successCount}, Gagal: ${failedCount}`,
      successCount > 0 ? "success" : "error"
    );
    setShowFinishedModal(true);
  };

  const handleStopBlast = () => {
    abortControllerRef.current = true;
    setStopRequested(true);
    addLog("Menghentikan pengiriman... Harap tunggu item yang sedang berjalan.", "info");
  };

  const addLog = (text: string, type: "info" | "success" | "error" = "info") => {
    const time = new Date().toLocaleTimeString("id-ID");
    setSendingLogs((prev) => [{ text, time, type }, ...prev]);
  };

  return (
    <div className="space-y-8 animate-slide-in-bottom pb-20">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black tracking-tight text-slate-900 flex items-center gap-4">
            <div className="p-3 premium-gradient rounded-2xl shadow-xl shadow-blue-500/20 text-white">
              <Send className="h-8 w-8" />
            </div>
            <span className="text-gradient">WhatsApp Blast</span>
          </h1>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-widest pl-1 border-l-4 border-blue-500 ml-1">
            Station Operator Broadcast • Automated Contact Messaging
          </p>
        </div>

        {/* Quick Stats Pill */}
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-lg shadow-slate-100/50">
          <div className="px-4 py-2 bg-slate-50 rounded-xl flex items-center gap-3">
            <Users className="h-4 w-4 text-blue-500" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Stasiun</span>
              <span className="text-sm font-black text-slate-800">{contacts.length}</span>
            </div>
          </div>
          <div className="px-4 py-2 bg-emerald-50 rounded-xl flex items-center gap-3">
            <PhoneCall className="h-4 w-4 text-emerald-600" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Ada Kontak WA</span>
              <span className="text-sm font-black text-emerald-700">
                {contacts.filter((c) => Boolean(c.operator_wa)).length}
              </span>
            </div>
          </div>
          <div className="px-4 py-2 bg-blue-50 rounded-xl flex items-center gap-3">
            <CheckSquare className="h-4 w-4 text-blue-600" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Terpilih</span>
              <span className="text-sm font-black text-blue-700">{validSelectedRecipients.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stepper Progress Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Step 1 */}
        <div
          onClick={() => !isSending && setCurrentStep(1)}
          className={cn(
            "p-5 rounded-3xl border transition-all cursor-pointer flex items-center gap-4 relative overflow-hidden",
            currentStep === 1
              ? "bg-white border-blue-500 shadow-xl shadow-blue-500/10 ring-2 ring-blue-500/20"
              : "bg-white/60 border-slate-100 hover:bg-white text-slate-500"
          )}
        >
          <div
            className={cn(
              "h-12 w-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-md transition-transform",
              currentStep === 1
                ? "premium-gradient text-white shadow-blue-500/30 scale-105"
                : "bg-slate-100 text-slate-400"
            )}
          >
            1
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Langkah 1</span>
            <span className="text-base font-black text-slate-800 truncate">Menambahkan Pesan</span>
            <span className="text-xs font-semibold text-slate-400 truncate">Tulis template & variabel</span>
          </div>
        </div>

        {/* Step 2 */}
        <div
          onClick={() => !isSending && setCurrentStep(2)}
          className={cn(
            "p-5 rounded-3xl border transition-all cursor-pointer flex items-center gap-4 relative overflow-hidden",
            currentStep === 2
              ? "bg-white border-blue-500 shadow-xl shadow-blue-500/10 ring-2 ring-blue-500/20"
              : "bg-white/60 border-slate-100 hover:bg-white text-slate-500"
          )}
        >
          <div
            className={cn(
              "h-12 w-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-md transition-transform",
              currentStep === 2
                ? "premium-gradient text-white shadow-blue-500/30 scale-105"
                : "bg-slate-100 text-slate-400"
            )}
          >
            2
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Langkah 2</span>
            <span className="text-base font-black text-slate-800 truncate">Pilih Kontak Stasiun</span>
            <span className="text-xs font-semibold text-slate-400 truncate">
              {validSelectedRecipients.length} stasiun terpilih
            </span>
          </div>
        </div>

        {/* Step 3 */}
        <div
          onClick={() => !isSending && setCurrentStep(3)}
          className={cn(
            "p-5 rounded-3xl border transition-all cursor-pointer flex items-center gap-4 relative overflow-hidden",
            currentStep === 3
              ? "bg-white border-blue-500 shadow-xl shadow-blue-500/10 ring-2 ring-blue-500/20"
              : "bg-white/60 border-slate-100 hover:bg-white text-slate-500"
          )}
        >
          <div
            className={cn(
              "h-12 w-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-md transition-transform",
              currentStep === 3
                ? "premium-gradient text-white shadow-blue-500/30 scale-105"
                : "bg-slate-100 text-slate-400"
            )}
          >
            3
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Langkah 3</span>
            <span className="text-base font-black text-slate-800 truncate">Konfirmasi & Kirim</span>
            <span className="text-xs font-semibold text-slate-400 truncate">Kirim batch pesan WA</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STEP 1: MENAMBAHKAN PESAN */}
      {/* ========================================================================= */}
      {currentStep === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-300">
          {/* Left Column: Message Editor & Templates */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] bg-white overflow-hidden">
              <CardHeader className="bg-gradient-to-br from-slate-50 to-white border-b border-slate-100 p-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-black text-slate-800">Susun Pesan Broadcast</CardTitle>
                      <CardDescription className="font-bold text-xs uppercase tracking-wider text-slate-400 mt-1">
                        Ketik pesan atau pilih dari template siap pakai
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-8 space-y-6">
                {/* Template Presets */}
                <div className="space-y-3">
                  <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400 pl-1 flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-blue-500" /> Pilih Template Cepat
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {TEMPLATES.map((tpl, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setMessage(tpl.text)}
                        className={cn(
                          "p-4 text-left rounded-2xl border text-xs font-bold transition-all flex flex-col justify-between gap-2 active:scale-95",
                          message === tpl.text
                            ? "border-blue-500 bg-blue-50/50 text-blue-700 shadow-sm"
                            : "border-slate-100 bg-slate-50/50 text-slate-600 hover:bg-slate-50 hover:border-slate-200"
                        )}
                      >
                        <Badge variant="outline" className="w-fit text-[9px] font-black uppercase tracking-wider">
                          {tpl.tag}
                        </Badge>
                        <span className="line-clamp-2 leading-relaxed">{tpl.title}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Variable Tags */}
                <div className="space-y-2">
                  <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400 pl-1">
                    Variabel Dinamis (Klik untuk menyisipkan)
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { tag: "{nama_stasiun}", label: "ID / Nama Stasiun" },
                      { tag: "{operator_wa}", label: "No. WA Operator" },
                      { tag: "{detail_lokasi}", label: "Detail Lokasi" },
                      { tag: "{kabupaten}", label: "Kabupaten" },
                      { tag: "{meter_number}", label: "ID PLN" },
                      { tag: "{phone_number}", label: "No. Orbit" },
                      { tag: "{tanggal}", label: "Tanggal" },
                      { tag: "{waktu}", label: "Waktu" },
                    ].map((item) => (
                      <Button
                        key={item.tag}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => insertTag(item.tag)}
                        className="rounded-xl border-slate-200 bg-slate-50/50 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 text-slate-700 text-xs font-bold transition-all active:scale-95"
                      >
                        + {item.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Message Textarea */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between pl-1 pr-1">
                    <Label htmlFor="message_content" className="font-black text-[10px] uppercase tracking-widest text-slate-400">
                      Isi Pesan WhatsApp <span className="text-rose-500">*</span>
                    </Label>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {message.length} Karakter
                    </span>
                  </div>
                  <textarea
                    id="message_content"
                    rows={11}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tuliskan pesan broadcast yang akan dikirim ke seluruh kontak operator stasiun..."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-4 font-mono text-sm leading-relaxed text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all resize-y"
                  />
                </div>

                {/* Next Step Button */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-bold">
                    <Info className="h-4 w-4" /> Variabel akan digantikan otomatis per stasiun saat pengiriman.
                  </div>
                  <Button
                    onClick={() => setCurrentStep(2)}
                    disabled={!message.trim()}
                    className="premium-gradient hover:opacity-95 text-white shadow-xl shadow-blue-500/20 font-black uppercase text-xs tracking-widest h-14 px-8 rounded-2xl flex items-center gap-3 transition-all active:scale-95"
                  >
                    Pilih Kontak Stasiun <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Live WhatsApp Bubble Preview */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] bg-white overflow-hidden">
              <CardHeader className="bg-[#075e54] text-white p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center font-black text-white text-lg">
                    {sampleContact.nama_stasiun.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-black text-base truncate">{sampleContact.nama_stasiun}</span>
                    <span className="text-[11px] text-emerald-200 font-medium truncate">
                      {sampleContact.operator_wa || "Online"} (Operator Stasiun)
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6 bg-[#efeae2] min-h-[460px] flex flex-col justify-between relative">
                {/* Background WhatsApp Doodle Simulation */}
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-white/80 text-slate-500 px-3 py-1 rounded-full shadow-sm">
                      Hari ini • Preview Tampilan Pesan
                    </span>
                  </div>

                  {/* Message Bubble */}
                  <div className="flex justify-end">
                    <div className="max-w-[90%] bg-[#dcf8c6] text-slate-800 rounded-2xl rounded-tr-none p-4 shadow-sm space-y-2 text-sm leading-relaxed whitespace-pre-wrap font-sans border border-emerald-100">
                      <p>{previewMessage || "Belum ada pesan yang ditulis..."}</p>
                      <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400 font-semibold pt-1">
                        <span>{new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
                        <Check className="h-3.5 w-3.5 text-blue-500" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Info Box */}
                <div className="mt-6 p-4 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/60 text-slate-600 text-xs space-y-1 shadow-sm">
                  <div className="font-black text-[10px] uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-blue-500" /> Contoh Target Data
                  </div>
                  <div className="font-bold text-slate-700 truncate">{sampleContact.nama_stasiun}</div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    WA: {sampleContact.operator_wa || "(Tidak ada nomor WA)"} • Lokasi: {sampleContact.detail_lokasi || "-"}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: MEMILIH KONTAK STASIUN */}
      {/* ========================================================================= */}
      {currentStep === 2 && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] bg-white overflow-hidden">
            {/* Header with Search and Selection Controls */}
            <div className="p-6 md:p-8 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl font-black text-slate-800 flex items-center gap-3">
                    <Users className="h-7 w-7 text-blue-600" />
                    Pilih Kontak Stasiun Tujuan
                  </CardTitle>
                  <CardDescription className="font-bold text-xs uppercase tracking-wider text-slate-400 mt-1">
                    Nomor tujuan diambil dari nomor operator aset dan dilabeli dengan ID Stasiun
                  </CardDescription>
                </div>

                {/* Actions: Select All / Deselect */}
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSelectAll}
                    className="h-12 px-5 rounded-2xl border-slate-200 font-black uppercase text-[10px] tracking-widest text-slate-700 hover:bg-slate-100 active:scale-95 transition-all"
                  >
                    <CheckSquare className="h-4 w-4 mr-2 text-emerald-600" />
                    Pilih Semua ({filteredContacts.filter((c) => Boolean(c.operator_wa)).length})
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDeselectAll}
                    className="h-12 px-5 rounded-2xl border-slate-200 font-black uppercase text-[10px] tracking-widest text-slate-700 hover:bg-slate-100 active:scale-95 transition-all"
                  >
                    <Square className="h-4 w-4 mr-2 text-rose-500" />
                    Batalkan Pilihan
                  </Button>
                </div>
              </div>

              {/* Search & Filter bar */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    placeholder="Cari ID Stasiun (misal KLHK299), nomor WA operator, lokasi..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-14 h-14 bg-white border-slate-200 font-bold rounded-2xl text-sm"
                  />
                </div>

                {/* Filter Dropdown/Buttons */}
                <div className="flex items-center gap-2 bg-slate-100/80 p-1.5 rounded-2xl">
                  <Button
                    type="button"
                    variant={filterType === "all" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setFilterType("all")}
                    className={cn(
                      "rounded-xl font-black uppercase text-[10px] tracking-widest h-11 px-4",
                      filterType === "all" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"
                    )}
                  >
                    Semua ({contacts.length})
                  </Button>
                  <Button
                    type="button"
                    variant={filterType === "has_wa" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setFilterType("has_wa")}
                    className={cn(
                      "rounded-xl font-black uppercase text-[10px] tracking-widest h-11 px-4",
                      filterType === "has_wa" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500"
                    )}
                  >
                    Ada WA ({contacts.filter((c) => Boolean(c.operator_wa)).length})
                  </Button>
                  <Button
                    type="button"
                    variant={filterType === "no_wa" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setFilterType("no_wa")}
                    className={cn(
                      "rounded-xl font-black uppercase text-[10px] tracking-widest h-11 px-4",
                      filterType === "no_wa" ? "bg-white text-rose-600 shadow-sm" : "text-slate-500"
                    )}
                  >
                    Tanpa WA ({contacts.filter((c) => !c.operator_wa).length})
                  </Button>
                </div>
              </div>
            </div>

            {/* Contacts Table */}
            <CardContent className="p-0">
              <div className="overflow-x-auto no-scrollbar">
                <Table>
                  <TableHeader className="bg-slate-50/80 sticky top-0 z-10 backdrop-blur-md">
                    <TableRow className="border-slate-100">
                      <TableHead className="w-14 pl-8 py-5 text-center">
                        <span className="sr-only">Pilih</span>
                      </TableHead>
                      <TableHead className="font-extrabold text-slate-600 uppercase tracking-widest text-[10px]">
                        Kontak ID / Nama Stasiun
                      </TableHead>
                      <TableHead className="font-extrabold text-slate-600 uppercase tracking-widest text-[10px]">
                        Nomor WA Penanggung Jawab
                      </TableHead>
                      <TableHead className="font-extrabold text-slate-600 uppercase tracking-widest text-[10px]">
                        Lokasi & Wilayah
                      </TableHead>
                      <TableHead className="font-extrabold text-slate-600 uppercase tracking-widest text-[10px]">
                        Tipe Aset
                      </TableHead>
                      <TableHead className="font-extrabold text-slate-600 text-center pr-8 uppercase tracking-widest text-[10px]">
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingContacts ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i} className="border-slate-50">
                          <TableCell colSpan={6} className="py-6 pl-8">
                            <div className="w-full h-10 bg-slate-100/50 rounded-xl animate-pulse" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : filteredContacts.length > 0 ? (
                      filteredContacts.map((contact, idx) => {
                        const isSelected = selectedIds.has(contact.nama_stasiun);
                        const hasWa = Boolean(contact.operator_wa && contact.operator_wa.trim().length >= 6);

                        return (
                          <TableRow
                            key={idx}
                            onClick={() => hasWa && toggleContact(contact.nama_stasiun)}
                            className={cn(
                              "group transition-all border-slate-50 cursor-pointer",
                              isSelected ? "bg-blue-50/40 hover:bg-blue-50/60" : "hover:bg-slate-50/50",
                              !hasWa && "opacity-60 cursor-not-allowed bg-slate-50/30"
                            )}
                          >
                            <TableCell className="pl-8 text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                disabled={!hasWa}
                                checked={isSelected}
                                onChange={() => toggleContact(contact.nama_stasiun)}
                                className="h-5 w-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                            </TableCell>
                            <TableCell>
                              <div className="font-black text-slate-800 text-sm tracking-tight">
                                {contact.nama_stasiun}
                              </div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                                Kontak ID Stasiun
                              </div>
                            </TableCell>
                            <TableCell>
                              {hasWa ? (
                                <div className="flex items-center gap-2">
                                  <div className="p-1.5 bg-emerald-50 rounded-lg">
                                    <PhoneCall className="h-4 w-4 text-emerald-600" />
                                  </div>
                                  <span className="font-black font-mono text-slate-700 text-sm">
                                    {contact.operator_wa}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-rose-500 font-bold italic flex items-center gap-1.5">
                                  <AlertCircle className="h-3.5 w-3.5" /> Belum ada nomor WA
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="text-xs font-bold text-slate-700">
                                {contact.detail_lokasi || contact.kabupaten || "-"}
                              </div>
                              <div className="text-[10px] text-slate-400 font-bold uppercase">
                                {contact.provinsi ? `${contact.provinsi}` : "Indonesia"}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {contact.has_pln && (
                                  <Badge
                                    variant="outline"
                                    className="bg-yellow-50 text-yellow-700 border-yellow-200 font-bold text-[9px] flex items-center gap-1"
                                  >
                                    <Zap className="h-3 w-3" /> PLN
                                  </Badge>
                                )}
                                {contact.has_orbit && (
                                  <Badge
                                    variant="outline"
                                    className="bg-blue-50 text-blue-700 border-blue-200 font-bold text-[9px] flex items-center gap-1"
                                  >
                                    <Wifi className="h-3 w-3" /> Orbit
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center pr-8">
                              {isSelected ? (
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100/80 text-blue-700 rounded-full font-black text-[10px] uppercase tracking-wider">
                                  <Check className="h-3 w-3" /> Terpilih
                                </span>
                              ) : hasWa ? (
                                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                                  Tersedia
                                </span>
                              ) : (
                                <span className="text-rose-400 text-[10px] font-bold uppercase tracking-wider">
                                  Lewati
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-64 text-center">
                          <div className="flex flex-col items-center justify-center gap-3 text-slate-300">
                            <Users className="h-12 w-12 opacity-20" />
                            <p className="text-sm font-bold text-slate-400">Tidak ada kontak stasiun yang cocok</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>

            {/* Bottom Footer Controls */}
            <div className="p-6 md:p-8 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                  className="h-14 px-6 rounded-2xl border-slate-200 font-black uppercase text-xs tracking-widest text-slate-600 hover:bg-white active:scale-95 transition-all flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" /> Kembali ke Pesan
                </Button>
                <div className="text-sm font-bold text-slate-600 pl-2">
                  <span className="font-black text-blue-600">{validSelectedRecipients.length}</span> stasiun siap dikirim
                </div>
              </div>

              <Button
                onClick={() => setCurrentStep(3)}
                disabled={validSelectedRecipients.length === 0}
                className="premium-gradient hover:opacity-95 text-white shadow-xl shadow-blue-500/20 font-black uppercase text-xs tracking-widest h-14 px-8 rounded-2xl flex items-center gap-3 transition-all active:scale-95"
              >
                Lanjut ke Konfirmasi Pengiriman <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: KONFIRMASI & KIRIM */}
      {/* ========================================================================= */}
      {currentStep === 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-300">
          {/* Left Column: Summary Card & Action */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] bg-white overflow-hidden">
              <CardHeader className="bg-gradient-to-br from-slate-50 to-white border-b border-slate-100 p-8">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                    <Send className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-black text-slate-800">Konfirmasi WA Blast</CardTitle>
                    <CardDescription className="font-bold text-xs uppercase tracking-wider text-slate-400 mt-1">
                      Periksa kembali rincian penerima dan jadwal pengiriman sebelum eksekusi
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-8 space-y-6">
                {/* Summary Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-5 bg-blue-50/60 rounded-2xl border border-blue-100 space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">
                      Total Penerima
                    </span>
                    <div className="text-2xl font-black text-blue-700">
                      {validSelectedRecipients.length} <span className="text-sm font-bold">Stasiun</span>
                    </div>
                  </div>

                  <div className="p-5 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">
                      Jeda Antar Pesan
                    </span>
                    <div className="text-2xl font-black text-indigo-700">
                      {(delayMs / 1000).toFixed(1)} <span className="text-sm font-bold">Detik</span>
                    </div>
                  </div>

                  <div className="p-5 bg-amber-50/60 rounded-2xl border border-amber-100 space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">
                      Estimasi Waktu
                    </span>
                    <div className="text-2xl font-black text-amber-800">
                      ~{Math.ceil((validSelectedRecipients.length * delayMs) / 1000)}{" "}
                      <span className="text-sm font-bold">Detik</span>
                    </div>
                  </div>
                </div>

                {/* Delay configuration */}
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="delay-select" className="font-black text-[10px] uppercase tracking-widest text-slate-500 flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-blue-500" /> Kecepatan Pengiriman (Safe Rate Limit)
                    </Label>
                    <span className="text-xs font-bold text-slate-600 font-mono">{(delayMs / 1000).toFixed(1)}s / stasiun</span>
                  </div>
                  <div className="flex gap-3">
                    {[
                      { label: "Cepat (1.0s)", value: 1000 },
                      { label: "Optimal (1.2s)", value: 1200 },
                      { label: "Aman (2.0s)", value: 2000 },
                      { label: "Sangat Aman (3.0s)", value: 3000 },
                    ].map((item) => (
                      <Button
                        key={item.value}
                        type="button"
                        variant={delayMs === item.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setDelayMs(item.value)}
                        disabled={isSending}
                        className={cn(
                          "flex-1 rounded-xl text-[10px] font-black uppercase tracking-wider h-10",
                          delayMs === item.value ? "bg-blue-600 text-white" : "border-slate-200 text-slate-600"
                        )}
                      >
                        {item.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Message preview snippet */}
                <div className="space-y-2">
                  <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400 pl-1">
                    Teks Pesan Yang Akan Dikirim
                  </Label>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-mono text-slate-700 whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">
                    {message}
                  </div>
                </div>

                {/* Progress bar during sending */}
                {isSending && (
                  <div className="p-6 bg-blue-50/70 rounded-2xl border border-blue-200 space-y-4 animate-in fade-in">
                    <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-blue-700">
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        {currentSendingIndex >= 0 && currentSendingIndex < validSelectedRecipients.length
                          ? `Mengirim ke ${validSelectedRecipients[currentSendingIndex].nama_stasiun} (${currentSendingIndex + 1}/${validSelectedRecipients.length})...`
                          : "Sedang Memproses..."}
                      </span>
                      <span className="font-mono text-sm font-black">{sendProgress}%</span>
                    </div>

                    <div className="w-full bg-blue-100 h-3.5 rounded-full overflow-hidden p-0.5">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-300 shadow-sm"
                        style={{ width: `${Math.max(sendProgress, 5)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                        <span className="text-emerald-600">
                          Berhasil: {sendResults.filter((r) => r.success).length}
                        </span>
                        <span className="text-rose-600">
                          Gagal: {sendResults.filter((r) => !r.success).length}
                        </span>
                        <span className="text-slate-400">
                          Sisa: {Math.max(0, validSelectedRecipients.length - sendResults.length)}
                        </span>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleStopBlast}
                        disabled={stopRequested}
                        className="rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 text-[10px] font-black uppercase tracking-wider h-8 px-3"
                      >
                        {stopRequested ? "Menghentikan..." : "Hentikan Broadcast"}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Bottom Navigation / Action */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(2)}
                    disabled={isSending}
                    className="h-14 px-6 rounded-2xl border-slate-200 font-black uppercase text-xs tracking-widest text-slate-600 hover:bg-slate-100 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" /> Ubah Kontak
                  </Button>

                  <Button
                    type="button"
                    onClick={() => setShowConfirmModal(true)}
                    disabled={isSending || validSelectedRecipients.length === 0}
                    className="premium-gradient hover:opacity-95 text-white shadow-xl shadow-blue-500/20 font-black uppercase text-xs tracking-widest h-14 px-8 rounded-2xl flex items-center gap-3 transition-all active:scale-95"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" /> Mengirim ({sendProgress}%)...
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5" /> Kirim Pesan Sekarang
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Selected Stations List Preview & Live Logs */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] bg-white overflow-hidden">
              <CardHeader className="bg-gradient-to-br from-slate-50 to-white border-b border-slate-100 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-lg font-black text-slate-800">
                      Daftar Kontak Tujuan ({validSelectedRecipients.length})
                    </CardTitle>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-black uppercase tracking-wider">
                    ID Stasiun
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <div className="max-h-[350px] overflow-y-auto divide-y divide-slate-100 no-scrollbar">
                  {validSelectedRecipients.map((c, i) => {
                    const result = sendResults.find((r) => r.nama_stasiun === c.nama_stasiun);
                    const isCurrentlyProcessing = isSending && currentSendingIndex === i;

                    return (
                      <div
                        key={i}
                        className={cn(
                          "p-4 transition-colors flex items-center justify-between gap-3",
                          isCurrentlyProcessing ? "bg-blue-50/80" : "hover:bg-slate-50"
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-8 w-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-black text-xs shrink-0">
                            {i + 1}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-slate-800 text-xs truncate">{c.nama_stasiun}</span>
                            <span className="font-mono text-[10px] text-slate-400">{c.operator_wa}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isCurrentlyProcessing ? (
                            <Badge className="bg-blue-500 text-white font-bold text-[9px] uppercase tracking-wider animate-pulse flex items-center gap-1">
                              <Loader2 className="h-3 w-3 animate-spin" /> Mengirim
                            </Badge>
                          ) : result ? (
                            result.success ? (
                              <Badge className="bg-emerald-500 text-white font-bold text-[9px] uppercase tracking-wider flex items-center gap-1">
                                <Check className="h-3 w-3" /> Terkirim
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="font-bold text-[9px] uppercase tracking-wider">
                                Gagal
                              </Badge>
                            )
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                              {isSending ? "Menunggu" : "Siap"}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Live Logs / Activity Stream */}
            {sendingLogs.length > 0 && (
              <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] bg-slate-900 text-white overflow-hidden">
                <CardHeader className="p-5 border-b border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                      <RefreshCw className={cn("h-3.5 w-3.5", isSending && "animate-spin text-blue-400")} /> Log Aktivitas
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">{sendingLogs.length} events</span>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-2 max-h-[180px] overflow-y-auto font-mono text-[11px] no-scrollbar">
                    {sendingLogs.map((log, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="text-slate-500 shrink-0">[{log.time}]</span>
                        <span
                          className={cn(
                            log.type === "success" && "text-emerald-400 font-bold",
                            log.type === "error" && "text-rose-400 font-bold",
                            log.type === "info" && "text-slate-300"
                          )}
                        >
                          {log.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL KONFIRMASI PENGIRIMAN */}
      {/* ========================================================================= */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-[480px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <div className="premium-gradient p-8 text-white">
            <DialogHeader>
              <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
                <Send className="h-7 w-7 text-white" />
              </div>
              <DialogTitle className="text-2xl font-black tracking-tight">Kirim WhatsApp Broadcast?</DialogTitle>
              <DialogDescription className="text-blue-100 font-medium text-xs mt-1">
                Pesan akan dikirimkan ke {validSelectedRecipients.length} nomor WA operator stasiun.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-8 space-y-6">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-bold uppercase">Penerima:</span>
                <span className="font-black text-slate-800">{validSelectedRecipients.length} Kontak Stasiun</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-bold uppercase">Safe Delay:</span>
                <span className="font-black text-slate-800">{(delayMs / 1000).toFixed(1)} Detik / Pesan</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-bold uppercase">Estimasi Durasi:</span>
                <span className="font-black text-slate-800">
                  ~{Math.ceil((validSelectedRecipients.length * delayMs) / 1000)} Detik
                </span>
              </div>
            </div>

            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-800 text-xs font-semibold flex gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <p>Pastikan server WAHA (WhatsApp Gateway) dalam kondisi connected dan aktif sebelum mengirim.</p>
            </div>

            <DialogFooter className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 h-14 rounded-2xl font-black uppercase text-xs tracking-widest text-slate-600 border-slate-200"
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={startBlast}
                className="flex-1 premium-gradient hover:opacity-95 text-white h-14 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
              >
                Mulai Kirim
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL LAPORAN HASIL PENGIRIMAN SELESAI */}
      {/* ========================================================================= */}
      <Dialog open={showFinishedModal} onOpenChange={setShowFinishedModal}>
        <DialogContent className="sm:max-w-[550px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-white">
            <DialogHeader>
              <div className="h-14 w-14 rounded-2xl bg-emerald-500 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/30">
                <CheckCircle2 className="h-8 w-8 text-white" />
              </div>
              <DialogTitle className="text-2xl font-black tracking-tight">Pengiriman Selesai!</DialogTitle>
              <DialogDescription className="text-slate-300 font-medium text-xs mt-1">
                Laporan detail status pengiriman pesan ke operator stasiun.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-8 space-y-6">
            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total</div>
                <div className="text-2xl font-black text-slate-800">{sendResults.length}</div>
              </div>
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
                <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Berhasil</div>
                <div className="text-2xl font-black text-emerald-700">
                  {sendResults.filter((r) => r.success).length}
                </div>
              </div>
              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 text-center">
                <div className="text-[10px] font-black uppercase tracking-widest text-rose-600">Gagal</div>
                <div className="text-2xl font-black text-rose-700">
                  {sendResults.filter((r) => !r.success).length}
                </div>
              </div>
            </div>

            {/* Results Table */}
            <div className="space-y-2">
              <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400 pl-1">
                Rincian Status Per Stasiun
              </Label>
              <div className="max-h-56 overflow-y-auto rounded-2xl border border-slate-100 divide-y divide-slate-100 no-scrollbar">
                {sendResults.map((res, i) => (
                  <div key={i} className="p-3.5 flex items-center justify-between text-xs">
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="font-bold text-slate-800 truncate">{res.nama_stasiun}</span>
                      <span className="text-[10px] font-mono text-slate-400">{res.operator_wa}</span>
                    </div>
                    {res.success ? (
                      <Badge className="bg-emerald-500 text-white font-bold text-[9px] uppercase tracking-wider shrink-0">
                        Terkirim
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="font-bold text-[9px] uppercase tracking-wider shrink-0" title={res.error}>
                        Gagal
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                onClick={() => {
                  setShowFinishedModal(false);
                  setCurrentStep(1);
                }}
                className="w-full premium-gradient text-white h-14 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-500/20"
              >
                Tutup & Mulai Broadcast Baru
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
