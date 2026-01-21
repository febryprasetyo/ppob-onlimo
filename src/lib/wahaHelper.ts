export const sendWAMessage = async (to: string, message: string) => {
  const WAHA_URL = process.env.WAHA_URL || "http://localhost:3000/api/sendText";
  
  // Normalize phone number: convert leading '0' to '62'
  let cleanNumber = to.replace(/[^0-9@]/g, ""); // Remove non-numeric except @
  if (cleanNumber.startsWith("0")) {
    cleanNumber = "62" + cleanNumber.substring(1);
  }
  
  // Format phone number to inclusion of @c.us if not present
  const chatId = cleanNumber.includes("@") ? cleanNumber : `${cleanNumber}@c.us`;

  const WAHA_API_KEY = process.env.WAHA_API_KEY;

  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (WAHA_API_KEY) {
      headers["X-Api-Key"] = WAHA_API_KEY;
    }

    const response = await fetch(WAHA_URL, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        chatId: chatId,
        text: message,
        session: "default",
        linkPreview: false
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("WAHA API Error:", response.status, errText);
    }

    return response.ok;
  } catch (error) {
    console.error("WAHA Network Error (Check your .env WAHA_URL):", error);
    return false;
  }
};
