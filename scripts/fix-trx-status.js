const knex = require('knex');
const config = {
  client: 'postgresql',
  connection: {
    host: 'localhost',
    port: 5433,
    user: 'dbonlimo',
    password: 'oms001',
    database: 'ppob_db',
  },
};

const db = knex(config);

async function fixTransaction() {
  const refId = "PLN-1768903975523";
  const sn = "5721-7714-3897-2629-3021/SHINTA-HANDAYANI/R1M/900VA/14.5KWH"; 
  // Cleaned up SN slightly or keep raw? Digiflazz gave "5721.../SHINTA...  /..."
  const rawSn = "5721-7714-3897-2629-3021/SHINTA-HANDAYANI  /R1M/900VA/14.5KWH";

  try {
    console.log("Updating transaction...");
    
    // Update Trx
    await db('trx_pln')
      .where('ref_id', refId)
      .update({
        status: 'SUCCESS',
        token_sn: rawSn,
        message: 'Transaksi Sukses (Manual Verify)',
        updated_at: new Date()
      });

    // Find Asset ID
    const trx = await db('trx_pln').where('ref_id', refId).first();
    
    if (trx) {
        console.log("Updating Asset ID:", trx.asset_id);
        // Update Asset
        await db('assets_pln')
          .where('id', trx.asset_id)
          .update({
            last_trx_status: 'SUCCESS',
            last_trx_at: new Date()
          });
    }

    console.log("Update Complete.");

  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit();
  }
}

fixTransaction();
