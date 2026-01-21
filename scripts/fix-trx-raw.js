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

async function updateRawResponse() {
  const refId = "PLN-1768903975523";
  
  // The success response we got from verification
  const successResponse = {
    "data": {
      "ref_id": "PLN-1768903975523",
      "customer_no": "14461091564",
      "buyer_sku_code": "pln20",
      "message": "Transaksi Sukses",
      "status": "Sukses",
      "rc": "00",
      "buyer_last_saldo": 159273,
      "sn": "5721-7714-3897-2629-3021/SHINTA-HANDAYANI  /R1M/900VA/14.5KWH",
      "price": 20590,
      "tele": "@arikosutrisna",
      "wa": "087860288354"
    }
  };

  try {
    console.log("Updating raw_response for:", refId);
    
    await db('trx_pln')
      .where('ref_id', refId)
      .update({
        raw_response: JSON.stringify(successResponse),
        updated_at: new Date()
      });

    console.log("Update Complete.");

  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit();
  }
}

updateRawResponse();
