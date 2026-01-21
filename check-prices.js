const crypto = require("crypto");

const DF_USER = "guyokaopwXXg";
const DF_KEY = "dev-520cc880-f0e8-11f0-95db-8f11f872b3de";

async function checkPrices() {
  const sign = crypto.createHash("md5").update(DF_USER + DF_KEY + "pricelist").digest("hex");
  const payload = {
    cmd: "prepaid",
    username: DF_USER,
    sign: sign,
  };

  console.log("Checking Price List...");
  console.log("Payload:", JSON.stringify(payload));
  
  const response = await fetch("https://api.digiflazz.com/v1/price-list", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  console.log("Response:", JSON.stringify(data).substring(0, 500));
  if (data.data) {
      console.log("Total items:", Array.isArray(data.data) ? data.data.length : "Not an array");
      if (Array.isArray(data.data) && data.data.length > 0) {
          console.log("First item:", data.data[0]);
      }
  }
}

checkPrices();
