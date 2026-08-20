import db from "../db";
import { TopupCategory, FlowType, NominalType } from "./types";

interface ImportResult {
  success: boolean;
  totalRows: number;
  acceptedCount: number;
  rejectedCount: number;
  importedCount: number;
  errors: string[];
}

// Check whether product is non-MVP
function isNonMvpProduct(sku: string, name: string): boolean {
  const lowerSku = sku.toLowerCase();
  const lowerName = name.toLowerCase();

  // Exclude games (ff, ml, pubg, etc.)
  if (lowerSku.startsWith("ff") || lowerSku.startsWith("ml") || lowerName.includes("diamond") || lowerName.includes("mobilelegend") || lowerName.includes("free fire")) {
    return true;
  }
  // Exclude TV (kvision, transvision, etc.)
  if (lowerSku.startsWith("kvision") || lowerName.includes("k-vision") || lowerName.includes("gol paket")) {
    return true;
  }
  // Exclude Gas (pertagas)
  if (lowerSku.startsWith("pertagas") || lowerName.includes("pertagas")) {
    return true;
  }
  // Exclude Masa Aktif
  if (lowerSku.includes("active") || lowerName.includes("masa aktif")) {
    return true;
  }
  // Exclude Perdana (physical / activation)
  if (lowerName.includes("perdana") || lowerSku.startsWith("axp") || lowerSku.startsWith("tact")) {
    return true;
  }
  // Exclude Physical Vouchers
  if (lowerSku.startsWith("vs") || lowerName.startsWith("voucher")) {
    return true;
  }
  // Exclude utility check SKUs like danacek
  if (lowerSku === "danacek" || lowerName.includes("cek nama pengguna")) {
    return true;
  }

  return false;
}

function detectBrandAndCategory(sku: string, name: string, isPostpaidBlock: boolean): {
  category: TopupCategory;
  brand: string;
  flowType: FlowType;
  nominalType: NominalType;
} | null {
  const lowerSku = sku.toLowerCase();
  const lowerName = name.toLowerCase();

  // 1. Postpaid Block
  if (isPostpaidBlock) {
    if (lowerName.includes("speedy") || lowerName.includes("indihome")) {
      return {
        category: "INTERNET_BILL",
        brand: "INDIHOME",
        flowType: "POSTPAID",
        nominalType: "VARIABLE",
      };
    }
    if (lowerName.includes("bebas nominal") || lowerName.includes("dana") || lowerName.includes("gopay") || lowerName.includes("ovo") || lowerName.includes("shopee") || lowerName.includes("linkaja")) {
      let brand = "EMONEY";
      if (lowerName.includes("dana")) brand = "DANA";
      else if (lowerName.includes("gopay") || lowerName.includes("go pay")) brand = "GOPAY";
      else if (lowerName.includes("ovo")) brand = "OVO";
      else if (lowerName.includes("shopee")) brand = "SHOPEEPAY";
      else if (lowerName.includes("linkaja")) brand = "LINKAJA";

      return {
        category: "EMONEY",
        brand,
        flowType: "POSTPAID",
        nominalType: "VARIABLE",
      };
    }
    return null;
  }

  // 2. Prepaid Block
  // PLN Token
  if (lowerName.startsWith("pln") || lowerSku.startsWith("pln")) {
    return {
      category: "PLN_TOKEN",
      brand: "PLN",
      flowType: "PREPAID",
      nominalType: "FIXED",
    };
  }

  // E-Money Prepaid (Fixed Nominals)
  if (lowerName.includes("dana") || lowerName.includes("go pay") || lowerName.includes("gopay") || lowerName.includes("ovo") || lowerName.includes("shopeepay") || lowerName.includes("linkaja")) {
    let brand = "EMONEY";
    if (lowerName.includes("dana")) brand = "DANA";
    else if (lowerName.includes("gopay") || lowerName.includes("go pay")) brand = "GOPAY";
    else if (lowerName.includes("ovo")) brand = "OVO";
    else if (lowerName.includes("shopee")) brand = "SHOPEEPAY";
    else if (lowerName.includes("linkaja")) brand = "LINKAJA";

    return {
      category: "EMONEY",
      brand,
      flowType: "PREPAID",
      nominalType: "FIXED",
    };
  }

  // Mobile Operators (Pulsa / Paket Data)
  let brand = "UNKNOWN";
  if (lowerName.includes("telkomsel") || lowerSku.startsWith("s") || lowerSku.startsWith("flash") || lowerSku.startsWith("orbit")) {
    brand = "TELKOMSEL";
  } else if (lowerName.includes("by.u") || lowerSku.startsWith("byu")) {
    brand = "BYU";
  } else if (lowerName.includes("indosat") || lowerSku.startsWith("i") || lowerSku.startsWith("if") || lowerSku.startsWith("yellow")) {
    brand = "INDOSAT";
  } else if (lowerName.includes("axis") || lowerSku.startsWith("ax")) {
    brand = "AXIS";
  } else if (lowerName.includes("xl") || lowerSku.startsWith("x")) {
    brand = "XL";
  } else if (lowerName.includes("three") || lowerName.includes("tri") || lowerSku.startsWith("t") || lowerSku.startsWith("happy")) {
    brand = "TRI";
  } else if (lowerName.includes("smartfren") || lowerSku.startsWith("sm")) {
    brand = "SMARTFREN";
  }

  // Distinguish Paket Data vs Pulsa
  const isData =
    lowerName.includes("data") ||
    lowerName.includes("gb") ||
    lowerName.includes("flash") ||
    lowerName.includes("freedom") ||
    lowerName.includes("happy") ||
    lowerName.includes("unlimited") ||
    lowerName.includes("aigo") ||
    lowerName.includes("yellow") ||
    lowerName.includes("orbit");

  return {
    category: isData ? "PAKET_DATA" : "PULSA",
    brand,
    flowType: "PREPAID",
    nominalType: "FIXED",
  };
}

function parseCurrency(str: string): number {
  if (!str) return 0;
  const clean = str.replace(/[^\d]/g, "");
  return clean ? Number(clean) : 0;
}

export async function importCatalogFromCsv(csvContent: string, importedBy: string = "system"): Promise<ImportResult> {
  const lines = csvContent.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  const result: ImportResult = {
    success: true,
    totalRows: 0,
    acceptedCount: 0,
    rejectedCount: 0,
    importedCount: 0,
    errors: [],
  };

  let currentSchema: "POSTPAID" | "PREPAID" | null = null;
  const productsToUpsert: any[] = [];
  const limitsToUpsert: any[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Split by tab or comma
    const cols = line.includes("\t") ? line.split("\t").map(c => c.trim()) : line.split(",").map(c => c.trim());

    // Header Detection
    if (cols.includes("Kode Produk") && cols.includes("Admin") && cols.includes("Komisi")) {
      currentSchema = "POSTPAID";
      continue;
    }
    if (cols.includes("Kode Produk") && cols.includes("Harga") && cols.includes("Deskripsi")) {
      currentSchema = "PREPAID";
      continue;
    }

    if (!currentSchema) continue;

    result.totalRows++;

    if (currentSchema === "POSTPAID") {
      // Columns: No, Kode Produk, Produk, Seller, Admin, Komisi, Status, Perubahan Terakhir
      if (cols.length < 7) {
        result.rejectedCount++;
        result.errors.push(`Baris ${i + 1}: Format kolom pascabayar tidak lengkap (${line})`);
        continue;
      }

      const sku = cols[1];
      const name = cols[2];
      const seller = cols[3];
      const admin = parseCurrency(cols[4]);
      const commission = parseCurrency(cols[5]);
      const statusStr = cols[6];
      const isActive = statusStr.toLowerCase() === "aktif";

      if (isNonMvpProduct(sku, name)) {
        result.rejectedCount++;
        continue;
      }

      const meta = detectBrandAndCategory(sku, name, true);
      if (!meta) {
        result.rejectedCount++;
        result.errors.push(`Baris ${i + 1}: Kategori tidak dikenal (${name})`);
        continue;
      }

      result.acceptedCount++;
      productsToUpsert.push({
        sku,
        name,
        category: meta.category,
        brand: meta.brand,
        flow_type: meta.flowType,
        nominal_type: meta.nominalType,
        catalog_price: 0,
        catalog_admin: admin,
        catalog_commission: commission,
        seller_name: seller,
        is_active: isActive,
        description: name,
        source_updated_at: new Date(),
        updated_at: new Date(),
      });

      // Default limits for variable e-money
      if (meta.category === "EMONEY" && meta.nominalType === "VARIABLE") {
        limitsToUpsert.push({
          sku,
          min_amount: 10000,
          max_amount: 10000000,
          increment_amount: 1000,
          currency: "IDR",
        });
      }
    } else if (currentSchema === "PREPAID") {
      // Columns: No, Kode Produk, Produk, Seller, Harga, Harga Max, Stok, Status, Perubahan Terakhir, Deskripsi
      if (cols.length < 8) {
        result.rejectedCount++;
        result.errors.push(`Baris ${i + 1}: Format kolom prabayar tidak lengkap (${line})`);
        continue;
      }

      const sku = cols[1];
      const name = cols[2];
      const seller = cols[3];
      const price = parseCurrency(cols[4]);
      const statusStr = cols[7];
      const desc = cols[9] || name;
      const isActive = statusStr.toLowerCase() === "aktif";

      if (isNonMvpProduct(sku, name)) {
        result.rejectedCount++;
        continue;
      }

      const meta = detectBrandAndCategory(sku, name, false);
      if (!meta) {
        result.rejectedCount++;
        result.errors.push(`Baris ${i + 1}: Kategori prabayar tidak dikenal (${name})`);
        continue;
      }

      result.acceptedCount++;
      productsToUpsert.push({
        sku,
        name,
        category: meta.category,
        brand: meta.brand,
        flow_type: meta.flowType,
        nominal_type: meta.nominalType,
        catalog_price: price,
        catalog_admin: 0,
        catalog_commission: 0,
        seller_name: seller,
        is_active: isActive,
        description: desc,
        source_updated_at: new Date(),
        updated_at: new Date(),
      });
    }
  }

  // Database persistence with transaction
  try {
    await db.transaction(async (trx) => {
      for (const prod of productsToUpsert) {
        const [upserted] = await trx("topup_products")
          .insert(prod)
          .onConflict("sku")
          .merge([
            "name",
            "category",
            "brand",
            "flow_type",
            "nominal_type",
            "catalog_price",
            "catalog_admin",
            "catalog_commission",
            "seller_name",
            "is_active",
            "description",
            "source_updated_at",
            "updated_at",
          ])
          .returning(["id", "sku"]);

        // Handle limits for variable nominal products
        const limitItem = limitsToUpsert.find((l) => l.sku === prod.sku);
        if (limitItem && upserted?.id) {
          const existingLimit = await trx("topup_product_limits")
            .where({ product_id: upserted.id })
            .first();

          if (existingLimit) {
            await trx("topup_product_limits")
              .where({ id: existingLimit.id })
              .update({
                min_amount: limitItem.min_amount,
                max_amount: limitItem.max_amount,
                increment_amount: limitItem.increment_amount,
                updated_at: trx.fn.now(),
              });
          } else {
            await trx("topup_product_limits").insert({
              product_id: upserted.id,
              min_amount: limitItem.min_amount,
              max_amount: limitItem.max_amount,
              increment_amount: limitItem.increment_amount,
              currency: limitItem.currency,
            });
          }
        }
      }

      result.importedCount = productsToUpsert.length;

      // Log import audit
      await trx("topup_catalog_imports").insert({
        source_filename: "daftar-produk.csv",
        row_count: result.totalRows,
        accepted_count: result.acceptedCount,
        rejected_count: result.rejectedCount,
        error_report: JSON.stringify(result.errors),
        imported_by: importedBy,
      });
    });
  } catch (err: any) {
    console.error("Error saving catalog import:", err);
    result.success = false;
    result.errors.push(err.message || "Gagal menyimpan data ke database");
  }

  return result;
}
