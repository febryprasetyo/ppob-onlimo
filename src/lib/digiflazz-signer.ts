import crypto from "crypto";
import { DIGIFLAZZ_CONFIG } from "./digiflazz-config";

/**
 * Utilitas untuk membuat Signature Digiflazz
 * Formula: md5(username + apiKey + suffix)
 * 
 * Suffix bisa berupa:
 * - 'depo' untuk cek saldo
 * - 'pricelist' untuk daftar harga
 * - 'pln' untuk inquiry pln
 * - [ref_id] untuk transaksi
 */
export const getDigiflazzSign = (suffix: string) => {
  const { username, apiKey } = DIGIFLAZZ_CONFIG;
  
  // Debug log (remove in production)
  console.log(`[Signer] User: ${username}, Suffix: ${suffix}, Key Length: ${apiKey.length}`);
  if (apiKey.length === 0) console.error("[Signer] API Key is EMPTY!");

  return crypto
    .createHash("md5")
    .update(username + apiKey + suffix)
    .digest("hex");
};
