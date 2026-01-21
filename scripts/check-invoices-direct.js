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

async function checkInvoices() {
  try {
    const invoices = await db('invoices').select('*');
    console.log("Invoices Count:", invoices.length);
    if(invoices.length > 0) {
        console.log("Last Invoice:", invoices[0]);
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit();
  }
}

checkInvoices();
