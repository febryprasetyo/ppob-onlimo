const crypto = require("crypto");

const DF_USER = "guyokaopwXXg";
const DF_KEY = "dev-520cc880-f0e8-11f0-95db-8f11f872b3de";

async function checkBalance() {
  const sign = crypto.createHash("md5").update(DF_USER + DF_KEY + "depo").digest("hex");
  const payload = {
    username: DF_USER,
    cmd: "deposit",
    sign: sign,
  };

  console.log("Checking Balance...");
  const response = await fetch("https://api.digiflazz.com/v1/cek-saldo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  console.log("Balance Response:", JSON.stringify(data));
}

checkBalance();
