const crypto = require("crypto");

const DF_USER = "";
const DF_KEY = "";
const CUSTOMER_NO = "";
const REF_ID = "TEST" + Date.now();

async function testRefIdSign() {
    // Formula for transaction: md5(user + key + ref_id)
    const sign = crypto.createHash("md5").update(DF_USER + DF_KEY + REF_ID).digest("hex");

    const payload = {
        username: DF_USER,
        buyer_sku_code: "pln20",
        customer_no: CUSTOMER_NO,
        ref_id: REF_ID,
        commands: "pln-subscribe",
        sign: sign
    };

    console.log(`Testing RefID sign: ${REF_ID}`);
    const response = await fetch("https://api.digiflazz.com/v1/transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });
    const data = await response.json();
    console.log("Response:", JSON.stringify(data));
}

testRefIdSign();
