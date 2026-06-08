import db from "@/lib/db";

export async function generateTRXMessage(type: "PLN" | "ORBIT", asset: any, trx: any) {
  const stationName = asset.nama_stasiun;
  
  // Use start of TODAY, not start of Month
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  let plnStatusText: string | null = null;
  let orbitStatusText: string | null = null;

  // 1. Get PLN Status
  const plnAsset = await db("assets_pln").where("nama_stasiun", stationName).first();
  if (plnAsset) {
    if (type === "PLN") {
      const rawToken = trx.token_sn || trx.sn || "";
      plnStatusText = `Terisi Kode Token: ${rawToken.split('/')[0].trim()}`;
    } else {
      const lastPln = await db("trx_pln")
        .where("asset_id", plnAsset.id)
        .where("status", "SUCCESS")
        .where("created_at", ">=", startOfDay)
        .orderBy("created_at", "desc")
        .first();
      
      if (lastPln) {
        const rawToken = lastPln.token_sn || "";
        plnStatusText = `Terisi Kode Token: ${rawToken.split('/')[0].trim()}`;
      }
    }
  }

  // 2. Get Orbit Status
  const orbitAsset = await db("assets_orbit").where("nama_stasiun", stationName).first();
  if (orbitAsset) {
    if (type === "ORBIT") {
      orbitStatusText = "Diperpanjang";
    } else {
      const lastOrbit = await db("trx_orbit")
        .where("asset_id", orbitAsset.id)
        .whereIn("status", ["SUCCESS", "PENDING"])
        .where("created_at", ">=", startOfDay)
        .first();
      
      if (lastOrbit) {
        orbitStatusText = "Diperpanjang";
      }
    }
  }

  // Construct Message Points
  let messagePoints = "";
  let pointIndex = 1;

  if (plnStatusText) {
      messagePoints += `${pointIndex}. Listrik (PLN) Status: ${plnStatusText}\n\n`;
      pointIndex++;
  }
  
  if (orbitStatusText) {
      messagePoints += `${pointIndex}. Kuota Internet Status: ${orbitStatusText}\n\n`;
      pointIndex++;
  }

  if (type === "PLN") {
    return `Selamat siang Rekan Operator ${stationName},

Diinformasikan bahwa pengisian ulang *TOKEN LISTRIK* telah berhasil dilakukan dengan rincian sebagai berikut:

${messagePoints}

Mohon tindak lanjutnya untuk:
*Segera input kode token tersebut ke Kwh Meter di lokasi stasiun.*

Mohon konfirmasinya jika sudah diselesaikan. Terima kasih.`;
  } else {
    return `Selamat siang Rekan Operator ${stationName},

Diinformasikan bahwa pengisian ulang *KUOTA INTERNET* telah berhasil dilakukan dengan rincian sebagai berikut:

${messagePoints}

Mohon tindak lanjutnya untuk:
*Melakukan pengecekan validasi kuota masuk melalui aplikasi MyOrbit/MyTelkomsel.*

Mohon konfirmasinya jika sudah diselesaikan. Terima kasih.`;
  }
}
