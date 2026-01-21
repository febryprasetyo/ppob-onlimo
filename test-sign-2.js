const crypto = require("crypto");

const DF_USER = "";
const DF_KEY = "";
const CUSTOMER_NO = "";

const formulas = [
  { name: "user+key+'pln-subscribe'", base: DF_USER + DF_KEY + "pln-subscribe" },
  { name: "user+key+'pln'", base: DF_USER + DF_KEY + "pln" },
  { name: "user+key+cust", base: DF_USER + DF_KEY + CUSTOMER_NO },
  { name: "user+key+'pln-subscribe'+cust", base: DF_USER + DF_KEY + "pln-subscribe" + CUSTOMER_NO },
];

async function test() {
  for (const f of formulas) {
    const sign = crypto.createHash("md5").update(f.base).digest("hex");
    
    // Test for Inquiry Postpaid
    console.log(`Testing ${f.name} on Inquiry endpoint...`);
    try {
      const response = await fetch("https://api.digiflazz.com/v1/inquiry-pln", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: DF_USER, customer_no: CUSTOMER_NO, sign })
      });
      const data = await response.json();
      console.log(`Result: ${data.data?.rc} - ${data.data?.message}`);
    } catch (e) {}

    // Test for Transaction Endpoint (pln-subscribe)
    console.log(`Testing ${f.name} on Transaction endpoint...`);
    try {
      const response = await fetch("https://api.digiflazz.com/v1/transaction", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: DF_USER, customer_no: CUSTOMER_NO, commands: "pln-subscribe", sign })
      });
      const data = await response.json();
      console.log(`Result: ${data.data?.rc} - ${data.data?.message}`);
    } catch (e) {}
    console.log("-------------------");
  }
}
test();
