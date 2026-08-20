import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { importCatalogFromCsv } from "@/lib/topup/catalog-importer";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  // Only Admin can import catalog
  if (session.role !== "admin") {
    return NextResponse.json({ success: false, error: "Akses ditolak. Hanya admin yang dapat mengimpor katalog." }, { status: 403 });
  }

  try {
    const contentType = req.headers.get("content-type") || "";
    let csvContent = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ success: false, error: "File CSV tidak ditemukan" }, { status: 400 });
      }
      csvContent = await file.text();
    } else {
      const body = await req.json();
      csvContent = body.csvContent || "";
    }

    if (!csvContent || csvContent.trim().length === 0) {
      return NextResponse.json({ success: false, error: "Konten CSV kosong" }, { status: 400 });
    }

    const result = await importCatalogFromCsv(csvContent, session.username);

    return NextResponse.json({
      success: result.success,
      data: result,
      message: `Berhasil mengimpor ${result.importedCount} produk (${result.rejectedCount} baris di luar cakupan MVP diabaikan)`,
    });
  } catch (error: any) {
    console.error("Catalog Import Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Gagal memproses impor CSV" }, { status: 500 });
  }
}
