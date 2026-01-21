require('dotenv').config();
const { sendWAMessage } = require('../src/lib/wahaHelper');

async function test() {
    console.log("Testing WAHA URL:", process.env.WAHA_URL);
    const result = await sendWAMessage('08123456789', 'Test Debugging Message');
    console.log("Result:", result);
}

test();
