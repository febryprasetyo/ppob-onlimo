import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sendWAMessage } from "@/lib/wahaHelper";

interface RecipientItem {
  id?: string;
  nama_stasiun: string;
  operator_wa: string;
  meter_number?: string;
  phone_number?: string;
  detail_lokasi?: string;
  kabupaten?: string;
  provinsi?: string;
}

function formatMessageTemplate(template: string, recipient: RecipientItem): string {
  const now = new Date();
  const tanggal = now.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const waktu = now.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }) + " WIB";

  return template
    .replace(/{nama_stasiun}/gi, recipient.nama_stasiun || "")
    .replace(/{operator_wa}/gi, recipient.operator_wa || "")
    .replace(/{nomor_wa}/gi, recipient.operator_wa || "")
    .replace(/{meter_number}/gi, recipient.meter_number || "-")
    .replace(/{phone_number}/gi, recipient.phone_number || "-")
    .replace(/{detail_lokasi}/gi, recipient.detail_lokasi || "-")
    .replace(/{kabupaten}/gi, recipient.kabupaten || "-")
    .replace(/{provinsi}/gi, recipient.provinsi || "-")
    .replace(/{tanggal}/gi, tanggal)
    .replace(/{waktu}/gi, waktu);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { recipient, recipients, message, delayMs = 1200 } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "Pesan tidak boleh kosong" }, { status: 400 });
    }

    // 1. Single recipient mode (Recommended for client-side progressive blast)
    if (recipient && typeof recipient === "object") {
      const stationName = recipient.nama_stasiun || "Stasiun";
      const phone = recipient.operator_wa ? recipient.operator_wa.trim() : "";

      if (!phone) {
        return NextResponse.json({
          success: false,
          result: {
            nama_stasiun: stationName,
            operator_wa: "",
            success: false,
            error: "Nomor WhatsApp operator tidak tersedia",
          },
        });
      }

      try {
        const finalMessage = formatMessageTemplate(message, recipient);
        const sent = await sendWAMessage(phone, finalMessage);

        if (sent) {
          return NextResponse.json({
            success: true,
            result: {
              nama_stasiun: stationName,
              operator_wa: phone,
              success: true,
            },
          });
        } else {
          return NextResponse.json({
            success: false,
            result: {
              nama_stasiun: stationName,
              operator_wa: phone,
              success: false,
              error: "Gagal terkirim melalui server WAHA (cek status server WAHA)",
            },
          });
        }
      } catch (err: any) {
        console.error(`[WA Blast Send Single] Error sending to ${stationName}:`, err);
        return NextResponse.json({
          success: false,
          result: {
            nama_stasiun: stationName,
            operator_wa: phone,
            success: false,
            error: err.message || "Terjadi kesalahan saat pengiriman",
          },
        });
      }
    }

    // 2. Batch recipients mode
    if (!Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ error: "Pilih minimal 1 kontak stasiun tujuan" }, { status: 400 });
    }

    const results: Array<{
      nama_stasiun: string;
      operator_wa: string;
      success: boolean;
      error?: string;
    }> = [];

    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < recipients.length; i++) {
      const item: RecipientItem = recipients[i];
      const stationName = item.nama_stasiun || `Stasiun #${i + 1}`;
      const phone = item.operator_wa ? item.operator_wa.trim() : "";

      if (!phone) {
        results.push({
          nama_stasiun: stationName,
          operator_wa: "",
          success: false,
          error: "Nomor WhatsApp operator tidak tersedia",
        });
        failedCount++;
        continue;
      }

      try {
        const finalMessage = formatMessageTemplate(message, item);
        const sent = await sendWAMessage(phone, finalMessage);

        if (sent) {
          results.push({
            nama_stasiun: stationName,
            operator_wa: phone,
            success: true,
          });
          successCount++;
        } else {
          results.push({
            nama_stasiun: stationName,
            operator_wa: phone,
            success: false,
            error: "Gagal terkirim melalui server WAHA (cek status WAHA)",
          });
          failedCount++;
        }
      } catch (err: any) {
        console.error(`[WA Blast] Error sending to ${stationName} (${phone}):`, err);
        results.push({
          nama_stasiun: stationName,
          operator_wa: phone,
          success: false,
          error: err.message || "Terjadi kesalahan saat pengiriman",
        });
        failedCount++;
      }

      if (i < recipients.length - 1 && delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        total: recipients.length,
        successCount,
        failedCount,
      },
      results,
    });
  } catch (error: any) {
    console.error("[WA Blast Send] Critical Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
