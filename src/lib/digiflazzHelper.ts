import { getDigiflazzSign } from "./digiflazz-signer";
import { DIGIFLAZZ_CONFIG } from "./digiflazz-config";

const DF_USER = DIGIFLAZZ_CONFIG.username;

export const generateSignature = (text: string) => {
  return getDigiflazzSign(text);
};

export const digiflazzRequest = async (sku: string, customerId: string, refId: string) => {
  const sign = generateSignature(refId);
  const payload: any = {
    username: DF_USER,
    buyer_sku_code: sku,
    customer_no: customerId,
    ref_id: refId,
    sign: sign,
  };

  // Selalu tambahkan testing: true jika sedang dalam mode pengembangan (dev)
  // Ini krusial agar tidak terkena error RC 41 (Signature Salah) saat menggunakan API Key Dev
  if (!DIGIFLAZZ_CONFIG.isProd) {
    payload.testing = true;
  }

  console.log(">>> DIGIFLAZZ REQUEST:", JSON.stringify(payload, null, 2));

  try {
    const response = await fetch("https://api.digiflazz.com/v1/transaction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const resJson = await response.json();
    console.log("<<< DIGIFLAZZ RESPONSE:", JSON.stringify(resJson, null, 2));
    return resJson;
  } catch (error) {
    console.error("!!! DIGIFLAZZ REQUEST ERROR:", error);
    throw error;
  }
};

export const getDigiflazzBalance = async () => {
  const sign = generateSignature("depo");
  const payload = {
    username: DF_USER,
    cmd: "deposit",
    sign: sign,
  };

  const response = await fetch("https://api.digiflazz.com/v1/cek-saldo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  return data.data?.deposit || 0;
};

export const inquiryPln = async (customerNo: string) => {
  const cleanNo = customerNo.trim();
  const sign = generateSignature(cleanNo);
  
  const payload: any = {
    username: DF_USER,
    customer_no: cleanNo,
    sign: sign,
  };

  if (!DIGIFLAZZ_CONFIG.isProd) {
    payload.testing = true;
  }

  console.log(">>> DIGIFLAZZ INQUIRY PLN REQUEST:", JSON.stringify(payload, null, 2));

  try {
    const response = await fetch("https://api.digiflazz.com/v1/inquiry-pln", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const resJson = await response.json();
    console.log("<<< DIGIFLAZZ INQUIRY PLN RESPONSE:", JSON.stringify(resJson, null, 2));
    return resJson;
  } catch (error) {
    console.error("!!! DIGIFLAZZ INQUIRY ERROR:", error);
    throw error;
  }
};
