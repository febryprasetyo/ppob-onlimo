import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const plnAssets = await db("assets_pln").select(
      "id",
      "nama_stasiun",
      "meter_number",
      "operator_wa",
      "provinsi",
      "kabupaten",
      "detail_lokasi",
      "keterangan"
    );

    const orbitAssets = await db("assets_orbit").select(
      "id",
      "nama_stasiun",
      "phone_number",
      "operator_wa",
      "provinsi",
      "kabupaten",
      "detail_lokasi",
      "keterangan"
    );

    // Map unique stations and consolidate their operator contacts
    const stationMap = new Map<string, any>();

    for (const p of plnAssets) {
      const stationKey = p.nama_stasiun?.trim();
      if (!stationKey) continue;

      stationMap.set(stationKey, {
        id: `pln-${p.id}`,
        nama_stasiun: stationKey,
        operator_wa: p.operator_wa ? p.operator_wa.trim() : "",
        meter_number: p.meter_number || "",
        phone_number: "",
        provinsi: p.provinsi || "",
        kabupaten: p.kabupaten || "",
        detail_lokasi: p.detail_lokasi || "",
        keterangan: p.keterangan || "",
        has_pln: true,
        has_orbit: false,
      });
    }

    for (const o of orbitAssets) {
      const stationKey = o.nama_stasiun?.trim();
      if (!stationKey) continue;

      if (stationMap.has(stationKey)) {
        const existing = stationMap.get(stationKey);
        existing.phone_number = o.phone_number || "";
        existing.has_orbit = true;
        if (!existing.operator_wa && o.operator_wa) {
          existing.operator_wa = o.operator_wa.trim();
        }
        if (!existing.provinsi && o.provinsi) existing.provinsi = o.provinsi;
        if (!existing.kabupaten && o.kabupaten) existing.kabupaten = o.kabupaten;
        if (!existing.detail_lokasi && o.detail_lokasi) existing.detail_lokasi = o.detail_lokasi;
        if (!existing.keterangan && o.keterangan) existing.keterangan = o.keterangan;
      } else {
        stationMap.set(stationKey, {
          id: `orbit-${o.id}`,
          nama_stasiun: stationKey,
          operator_wa: o.operator_wa ? o.operator_wa.trim() : "",
          meter_number: "",
          phone_number: o.phone_number || "",
          provinsi: o.provinsi || "",
          kabupaten: o.kabupaten || "",
          detail_lokasi: o.detail_lokasi || "",
          keterangan: o.keterangan || "",
          has_pln: false,
          has_orbit: true,
        });
      }
    }

    // Convert map to array and sort numerically by ID Stasiun (e.g. KLHK299 - KLHK317)
    const contacts = Array.from(stationMap.values()).sort((a, b) =>
      a.nama_stasiun.localeCompare(b.nama_stasiun, undefined, { numeric: true, sensitivity: "base" })
    );

    return NextResponse.json({
      success: true,
      data: contacts,
      total: contacts.length,
      with_wa_count: contacts.filter(c => Boolean(c.operator_wa)).length,
    });
  } catch (error: any) {
    console.error("[WA Blast Contacts] Error fetching contacts:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch contacts" }, { status: 500 });
  }
}

