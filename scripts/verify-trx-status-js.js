
require('dotenv').config();
const crypto = require('crypto');

async function verifyStatus() {
  const refId = "PLN-1768903975523";
  const username = process.env.DIGIFLAZZ_USERNAME;
  const apiKey = process.env.DIGIFLAZZ_MODE === 'prod' 
      ? process.env.DIGIFLAZZ_API_KEY_PROD 
      : process.env.DIGIFLAZZ_API_KEY_DEV;

  if (!username || !apiKey) {
      console.error("Missing credentials in .env");
      return;
  }

  // md5(username + apiKey + ref_id)
  const sign = crypto.createHash('md5').update(username + apiKey + refId).digest('hex');

  const payload = {
    username: username,
    ref_id: refId,
    sign: sign
  };

  console.log("Checking status for:", refId);
  console.log("Using API Key:", apiKey);

  try {
    const response = await fetch("https://api.digiflazz.com/v1/transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    const resJson = await response.json();
    console.log("Digiflazz Response:", JSON.stringify(resJson, null, 2));

  } catch (err) {
      console.error("Fetch error:", err);
  }
}

verifyStatus();
