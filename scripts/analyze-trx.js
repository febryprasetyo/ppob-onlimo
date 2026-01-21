const knex = require('knex');
const config = {
  client: 'postgresql',
  connection: {
    host: 'localhost',
    port: 5433,
    user: '',
    password: '',
    database: '',
  },
};

const db = knex(config);

async function checkTransaction() {
  try {
    const meterNumber = '14461091564';
    
    // 1. Find Asset
    const asset = await db('assets_pln').where('meter_number', meterNumber).first();
    console.log("Asset Found:", asset ? `ID: ${asset.id}, Name: ${asset.nama_stasiun}` : "Not Found");

    if (asset) {
        // 2. Find Transaction
        const trx = await db('trx_pln')
            .where('asset_id', asset.id)
            .orderBy('created_at', 'desc')
            .first();
            
        console.log("Latest Transaction:", trx);
        
        if (trx && trx.raw_response) {
             console.log("Raw Response:", JSON.stringify(trx.raw_response, null, 2));
        }
    }

  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit();
  }
}

checkTransaction();
