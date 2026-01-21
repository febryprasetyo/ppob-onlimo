const db = require('./src/lib/db').default || require('./src/lib/db');

async function checkInvoices() {
  try {
    const invoices = await db('invoices').select('*');
    console.log("Invoices Count:", invoices.length);
    console.log("Invoices Data:", JSON.stringify(invoices, null, 2));
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit();
  }
}

checkInvoices();
