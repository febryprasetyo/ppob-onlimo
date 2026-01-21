const crypto = require("crypto");

const DF_USER = "";
const DF_KEY = "";
const CUSTOMER_NO = "";

async function testV1Transaction() {
    // Formula: md5(user + key + customer_no)
    const sign = crypto.createHash("md5").update(DF_USER + DF_KEY + CUSTOMER_NO).digest("hex");

    const payload = {
        username: DF_USER,
        buyer_sku_code: "pln20",
        customer_no: CUSTOMER_NO,
        ref_id: "TEST-INQ-" + Date.now(),
        commands: "pln-subscribe",
        sign: sign
    };

    console.log("Testing Transaction Endpoint with all fields...");
    const response = await fetch("https://api.digiflazz.com/v1/transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });
    const data = await response.json();
    console.log("Response:", JSON.stringify(data));
}

testV1Transaction();
