
import db from "../src/lib/db";
import { getDigiflazzSign } from "../src/lib/digiflazz-signer";
import { DIGIFLAZZ_CONFIG } from "../src/lib/digiflazz-config";

async function verifyStatus() {
  const refId = "PLN-1768903975523";
  const type = "PLN";

  try {
     const table = "trx_pln";
    const trx = await db(table).where("ref_id", refId).first();

    if (!trx) {
      console.log("Transaction not found in DB");
      return;
    }
    
    console.log("Current DB Status:", trx.status);

    // Call Digiflazz
    const sign = getDigiflazzSign(refId);
    const payload = {
      username: DIGIFLAZZ_CONFIG.username,
      ref_id: refId,
      sign: sign
    };

    console.log("Sending Payload to Digiflazz:", payload);

    const response = await fetch("https://api.digiflazz.com/v1/transaction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const resJson = await response.json();
    console.log("Response from Digiflazz:", JSON.stringify(resJson, null, 2));

  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit();
  }
}

verifyStatus();
