const crypto = require("crypto");

const DF_USER = "guyokaopwXXg";
const DF_KEY = "dev-520cc880-f0e8-11f0-95db-8f11f872b3de";
const CUSTOMER_NO = "56241047945";

async function testPlnSubscribe() {
    const formulas = [
        { name: "user+key+cust", sign: crypto.createHash("md5").update(DF_USER + DF_KEY + CUSTOMER_NO).digest("hex") },
        { name: "user+key+'pln-subscribe'", sign: crypto.createHash("md5").update(DF_USER + DF_KEY + "pln-subscribe").digest("hex") },
    ];

    for (const f of formulas) {
        console.log(`Testing pln-subscribe with sign ${f.name}...`);
        const payload = {
            username: DF_USER,
            commands: "pln-subscribe",
            customer_no: CUSTOMER_NO,
            sign: f.sign
        };
        const response = await fetch("https://api.digiflazz.com/v1/transaction", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        console.log("Response:", JSON.stringify(data));
        console.log("-------------------");
    }
}

testPlnSubscribe();
