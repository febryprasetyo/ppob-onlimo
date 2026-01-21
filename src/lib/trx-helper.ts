import db from "@/lib/db";

export async function generateTRXMessage(type: "PLN" | "ORBIT", asset: any, trx: any) {
  const stationName = asset.nama_stasiun;
  
  let plnStatusText = "-";
  let orbitStatusText = "-";

  // 1. Get PLN Status
  const plnAsset = await db("assets_pln").where("nama_stasiun", stationName).first();
  if (plnAsset) {
    if (type === "PLN") {
      plnStatusText = `Terisi Kode Token: ${trx.token_sn || trx.sn}`; // Handle both sn and token_sn depending on context
    } else {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const lastPln = await db("trx_pln")
        .where("asset_id", plnAsset.id)
        .where("status", "SUCCESS")
        .where("created_at", ">=", startOfMonth)
        .orderBy("created_at", "desc")
        .first();
      
      if (lastPln) {
        plnStatusText = `Terisi Kode Token: ${lastPln.token_sn}`;
      } else {
        plnStatusText = "Belum terisi (Bulan berjalan)";
      }
    }
  }

  // 2. Get Orbit Status
  const orbitAsset = await db("assets_orbit").where("nama_stasiun", stationName).first();
  if (orbitAsset) {
    if (type === "ORBIT") {
      orbitStatusText = "Diperpanjang";
    } else {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const lastOrbit = await db("trx_orbit")
        .where("asset_id", orbitAsset.id)
        .where("status", "SUCCESS")
        .where("created_at", ">=", startOfMonth)
        .first();
      
      orbitStatusText = lastOrbit ? "Diperpanjang" : "Belum diperpanjang (Bulan berjalan)";
    }
  }

  return `Selamat siang Rekan Operator,

Diinformasikan bahwa pengisian ulang utilitas operasional telah berhasil dilakukan dengan rincian sebagai berikut:

1. Listrik (PLN) Status: ${plnStatusText}

2. Kuota Internet Status: ${orbitStatusText}

Mohon tindak lanjutnya untuk:

Segera input kode token tersebut ke Kwh Meter.

Melakukan pengecekan validasi kuota masuk melalui aplikasi MyOrbit/MyTelkomsel.

Mohon konfirmasinya jika sudah diselesaikan. Terima kasih.`;
}
