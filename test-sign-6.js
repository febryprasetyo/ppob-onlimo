const crypto = require("crypto");

const DF_USER = "";
const DF_KEY = "";
const CUSTOMER_NO = "";

async function testInquiryOfficial() {
    const sign = crypto.createHash("md5").update(DF_USER + DF_KEY + CUSTOMER_NO).digest("hex");
    const payload = { username: DF_USER, customer_no: CUSTOMER_NO, sign: sign };

    console.log(`Testing Inquiry officially with sign: ${sign}`);
    const response = await fetch("https://api.digiflazz.com/v1/inquiry-pln", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });
    const data = await response.json();
    console.log("Response:", JSON.stringify(data));
}

testInquiryOfficial();
