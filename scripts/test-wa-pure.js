require('dotenv').config();

const WAHA_URL = process.env.WAHA_URL || "http://localhost:3000/api/sendText";
const WAHA_API_KEY = process.env.WAHA_API_KEY;

console.log("URL:", WAHA_URL);

async function test() {
    try {
        const response = await fetch(WAHA_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Api-Key": WAHA_API_KEY
            },
            body: JSON.stringify({
                chatId: "628123456789@c.us",
                text: "Pure JS Test",
                session: "default"
            })
        });
        console.log("Status:", response.status);
        const text = await response.text();
        console.log("Body:", text);
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
