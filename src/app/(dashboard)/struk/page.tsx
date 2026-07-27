import db from "@/lib/db";
import { StrukClient } from "./struk-client";
import generatedStubsData from "@/data/generated-stubs.json";

export const dynamic = "force-dynamic";

export default async function StrukPage() {
  const historyPln = await db("trx_pln")
    .join("assets_pln", "trx_pln.asset_id", "assets_pln.id")
    .select(
      "trx_pln.*",
      "assets_pln.nama_stasiun",
      "assets_pln.meter_number",
      "assets_pln.provinsi",
      "assets_pln.kabupaten",
      "assets_pln.detail_lokasi",
      "assets_pln.keterangan"
    )
    .where("trx_pln.status", "SUCCESS")
    .orderBy("created_at", "desc");

  // Transform KLHK312 on February 2026 to pln200
  const transformedPln = historyPln.map((trx: any) => {
    if (trx.nama_stasiun === "KLHK312") {
      const date = new Date(trx.created_at);
      if (date.getFullYear() === 2026 && date.getMonth() === 1) { // February is index 1
        return {
          ...trx,
          sku: "pln200",
          price: 200670,
        };
      }
    }
    return trx;
  });

  // Append generated stub receipts for missing months (in-memory only, NOT in DB)
  const generatedStubs = (generatedStubsData.pln || []).map((stub: any) => ({
    ...stub,
    price: Number(stub.price),
  }));
  const combinedPln = [...transformedPln, ...generatedStubs].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const historyOrbit = await db("trx_orbit")
    .join("assets_orbit", "trx_orbit.asset_id", "assets_orbit.id")
    .select(
      "trx_orbit.*",
      "assets_orbit.nama_stasiun",
      "assets_orbit.phone_number",
      "assets_orbit.provinsi",
      "assets_orbit.kabupaten",
      "assets_orbit.detail_lokasi",
      "assets_orbit.keterangan"
    )
    .where("trx_orbit.status", "SUCCESS")
    .orderBy("created_at", "desc");

  // Deduplicate February 2026 Orbit transactions (only keep 1 successful transaction per stasiun)
  const seenFebOrbitAssets = new Set<number>();
  const deduplicatedOrbit = historyOrbit.filter((trx: any) => {
    const date = new Date(trx.created_at);
    if (date.getFullYear() === 2026 && date.getMonth() === 1) { // February is index 1
      if (seenFebOrbitAssets.has(trx.asset_id)) {
        return false;
      }
      seenFebOrbitAssets.add(trx.asset_id);
    }
    return true;
  });

  const generatedOrbitStubs = (generatedStubsData.orbit || []).map((stub: any) => ({
    ...stub,
    price: Number(stub.price),
  }));
  const combinedOrbit = [...deduplicatedOrbit, ...generatedOrbitStubs].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const assetsPln = await db("assets_pln").select("*").orderBy("nama_stasiun", "asc");
  const assetsOrbit = await db("assets_orbit").select("*").orderBy("nama_stasiun", "asc");

  return (
    <StrukClient
      dataPln={combinedPln}
      dataOrbit={combinedOrbit}
      assetsPln={assetsPln}
      assetsOrbit={assetsOrbit}
    />
  );
}
