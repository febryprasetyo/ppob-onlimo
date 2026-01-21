import { DIGIFLAZZ_CONFIG } from "./digiflazz-config";
import { getDigiflazzSign } from "./digiflazz-signer";
import db from "./db";

const DF_USER = DIGIFLAZZ_CONFIG.username;
const DF_KEY = DIGIFLAZZ_CONFIG.apiKey;

/**
 * Inquiry PLN sesuai dokumentasi resmi:
 * https://developer.digiflazz.com/api/buyer/inquiry-pln/
 */
export const inquiryPln = async (customerNo: string) => {
  const cleanNo = customerNo.trim();
  
  // Sesuai dokumentasi resmi Digiflazz, untuk Inquiry PLN Postpaid:
  // Signature = md5(username + apiKey + customer_no)
  const sign = getDigiflazzSign(cleanNo);

  try {
    console.log(`[PLN Inquiry] Requesting name for: ${cleanNo} with sign suffix: ${cleanNo}`);
    const response = await fetch("https://api.digiflazz.com/v1/inquiry-pln", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: DF_USER,
        customer_no: cleanNo,
        sign: sign,
      }),
    });

    const resJson = await response.json();
    const data = resJson.data || {};

    // Jika Gagal Signature (RC 41)
    if (data.rc === "41") {
      console.error(`[PLN Inquiry] FAILED: Signature Error (RC 41). Check your API Key and Formula.`);
    }

    return {
      success: data.rc === "00" || data.status === "Sukses" || data.status === "Success",
      customer_name: data.name,
      customer_no: data.customer_no,
      meter_no: data.meter_no,
      subscriber_id: data.subscriber_id,
      segment_power: data.segment_power,
      message: data.message || resJson.message,
      rc: data.rc,
      raw: resJson,
      name: data.name
    };
  } catch (error: any) {
    console.error("[PLN Inquiry] Service Error:", error);
    throw new Error(error.message || "Failed to connect to Digiflazz");
  }
};

/**
 * Sync Price List from Digiflazz API to Database
 */
export const syncPriceListToDb = async () => {
  const sign = getDigiflazzSign("pricelist");

  try {
    const response = await fetch("https://api.digiflazz.com/v1/price-list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cmd: "prepaid",
        username: DF_USER,
        sign: sign,
      }),
    });

    const resJson = await response.json();
    
    if (resJson.data && Array.isArray(resJson.data)) {
      const products = resJson.data;
      
      // Batch Upsert (Knex internal batching or chunking is better for performance)
      await db.transaction(async (trx) => {
        const chunks = [];
        for (let i = 0; i < products.length; i += 100) {
          chunks.push(products.slice(i, i + 100));
        }

        for (const chunk of chunks) {
          await trx("digiflazz_products")
            .insert(chunk.map((p: any) => ({
              buyer_sku_code: p.buyer_sku_code,
              product_name: p.product_name,
              category: p.category,
              brand: p.brand,
              type: p.type,
              seller_name: p.seller_name,
              price: p.price,
              buyer_product_status: p.buyer_product_status,
              seller_product_status: p.seller_product_status,
              unlimited_stock: p.unlimited_stock,
              stock: p.stock,
              multi: p.multi,
              start_cut_off: p.start_cut_off,
              end_cut_off: p.end_cut_off,
              desc: p.desc,
              updated_at: trx.fn.now()
            })))
            .onConflict("buyer_sku_code")
            .merge();
        }
      });
      
      return { success: true, count: products.length };
    } else {
      return { 
        success: false, 
        message: resJson.data?.message || resJson.message || "Gagal sinkronisasi data" 
      };
    }
  } catch (error: any) {
    console.error("Sync Error:", error);
    return { success: false, message: error.message };
  }
};

/**
 * Get Price List from Database
 */
export const getPriceList = async () => {
  try {
    const products = await db("digiflazz_products").select("*").orderBy("product_name", "asc");
    
    // If DB is empty, try to sync once
    if (products.length === 0) {
      const syncResult = await syncPriceListToDb();
      if (syncResult.success) {
        return { success: true, data: await db("digiflazz_products").select("*").orderBy("product_name", "asc") };
      }
    }

    return { success: true, data: products };
  } catch (error: any) {
    console.error("Database Error:", error);
    return { success: false, data: [], message: error.message };
  }
};


