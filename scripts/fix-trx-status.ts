import db from "../src/lib/db";

const updates = [
  { nama: 'KLHK307', sn: '0538-6079-7851-1155-8967/KLHKBONE/R1/000001300/138.50' },
  { nama: 'KLHK308', sn: '2466-4349-2187-3203-4216/KEMENLINGKHDPDANKEHUT/P1/000001300/95.40' },
  { nama: 'KLHK309', sn: '0701-4648-2342-2224-6145/KMNTRIANLINGKHDPDANKH/P1/000001300/86.70' },
  { nama: 'KLHK310', sn: '0558-1269-8319-9121-8038/KEMENTRIANLING.HIDUPDN/P1/000001300/86.70' },
  { nama: 'KLHK311', sn: '6521-9260-7358-2900-1981/SPLURRGTANJUNG176/R1/000002200/64.10' }
];

async function run() {
  for (const item of updates) {
    const asset = await db("assets_pln").where("nama_stasiun", item.nama).first();
    if (!asset) {
      console.log(`Asset not found: ${item.nama}`);
      continue;
    }

    const trx = await db("trx_pln")
      .where("asset_id", asset.id)
      .orderBy("created_at", "desc")
      .first();

    if (!trx) {
      console.log(`Transaction not found for ${item.nama}`);
      continue;
    }

    console.log(`Updating ${item.nama} (Asset ID: ${asset.id}, Trx Ref: ${trx.ref_id})`);

    await db("trx_pln").where("id", trx.id).update({
      status: "SUCCESS",
      token_sn: item.sn,
      updated_at: db.fn.now()
    });

    await db("assets_pln").where("id", asset.id).update({
      last_trx_status: "SUCCESS",
      last_trx_at: db.fn.now()
    });

    console.log(`Updated ${item.nama} successfully.`);
  }
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
