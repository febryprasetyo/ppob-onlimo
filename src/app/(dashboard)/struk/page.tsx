import db from "@/lib/db";
import { StrukClient } from "./struk-client";

export const dynamic = "force-dynamic";

export default async function StrukPage() {
  const historyPln = await db("trx_pln")
    .join("assets_pln", "trx_pln.asset_id", "assets_pln.id")
    .select("trx_pln.*", "assets_pln.nama_stasiun", "assets_pln.meter_number")
    .where("trx_pln.status", "SUCCESS")
    .orderBy("created_at", "desc");

  const historyOrbit = await db("trx_orbit")
    .join("assets_orbit", "trx_orbit.asset_id", "assets_orbit.id")
    .select("trx_orbit.*", "assets_orbit.nama_stasiun", "assets_orbit.phone_number")
    .where("trx_orbit.status", "SUCCESS")
    .orderBy("created_at", "desc");

  return <StrukClient dataPln={historyPln} dataOrbit={historyOrbit} />;
}
