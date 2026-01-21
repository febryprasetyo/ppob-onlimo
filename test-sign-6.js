const crypto = require("crypto");

const DF_USER = "guyokaopwXXg";
const DF_KEY = "dev-520cc880-f0e8-11f0-95db-8f11f872b3de";
const CUSTOMER_NO = "1234567890"; // Testing ID for PLN Postpaid in Dev Mode

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
