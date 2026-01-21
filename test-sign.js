const crypto = require("crypto");

const DF_USER = "";
const DF_KEY = "";
const CUSTOMER_NO = "";

const formulas = [
  { name: "standard (user+key+cust)", base: DF_USER + DF_KEY + CUSTOMER_NO },
  { name: "static-pln (user+key+'pln')", base: DF_USER + DF_KEY + "pln" },
  { name: "dev-suffix (user+key+'dev')", base: DF_USER + DF_KEY + "dev" },
  { name: "cust-dev (user+key+cust+'dev')", base: DF_USER + DF_KEY + CUSTOMER_NO + "dev" },
  { name: "key-user-cust (key+user+cust)", base: DF_KEY + DF_USER + CUSTOMER_NO },
];

async function test() {
  for (const f of formulas) {
    const sign = crypto.createHash("md5").update(f.base).digest("hex");
    const payload = {
      username: DF_USER,
      customer_no: CUSTOMER_NO,
      sign: sign,
    };

    console.log(`Testing ${f.name}...`);
    try {
      const response = await fetch("https://api.digiflazz.com/v1/inquiry-pln", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      console.log(`Result: ${data.data?.rc || "?? "} - ${data.data?.message || "No data"}`);
    } catch (e) {
      console.log(`Error: ${e.message}`);
    }
    console.log("-------------------");
  }
}

test();
