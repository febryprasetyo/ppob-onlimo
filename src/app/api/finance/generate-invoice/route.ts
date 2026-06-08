import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { period_month, period_year, selected_orbit_ids = [], unique_code = 0 } = await req.json();
    // 1. Get PLN assets joined with digiflazz_products to get current prices
    const plnAssets = await db("assets_pln")
      .leftJoin("digiflazz_products", "assets_pln.default_sku", "digiflazz_products.buyer_sku_code")
      .select("digiflazz_products.price", "assets_pln.default_sku", "assets_pln.nama_stasiun", "digiflazz_products.product_name");
    
    const plnCount = plnAssets.length;

    // 2. Get Selected Orbit assets ONLY if IDs provided
    let orbitAssets: any[] = [];
    if (selected_orbit_ids && selected_orbit_ids.length > 0) {
      orbitAssets = await db("assets_orbit")
        .leftJoin("digiflazz_products", "assets_orbit.default_sku", "digiflazz_products.buyer_sku_code")
        .whereIn("assets_orbit.id", selected_orbit_ids)
        .select("digiflazz_products.price", "assets_orbit.default_sku", "assets_orbit.nama_stasiun", "digiflazz_products.product_name");
    }
    // Round UP each price to nearest 1.000 (e.g. 99.800 -> 100.000)
    // Helper to group assets by SKU
    const groupAssets = (assets: any[]) => {
      const groups: Record<string, { count: number, total: number, price: number, name: string   }> = {};
      
      for (const asset of assets) {
        const sku = asset.default_sku || 'unknown';
        if (!groups[sku]) {
          groups[sku] = { count: 0, total: 0, price: Number(asset.price || 0), name: asset.product_name || sku };
        }
        
        // Round each asset price up to 1000
        const price = Number(asset.price || (sku.startsWith('pln') ? 100000 : 135000)); // Fallback
        const roundedUp = Math.ceil(price / 1000) * 1000;
        
        groups[sku].count++;
        groups[sku].total += roundedUp;
      }
      return groups;
    };

    const plnGroups = groupAssets(plnAssets);
    const orbitGroups = groupAssets(orbitAssets);

    let calculatedTotal = 0;
    for (const group of Object.values(plnGroups)) calculatedTotal += group.total;
    for (const group of Object.values(orbitGroups)) calculatedTotal += group.total;
    
    const adminFee = 1332;
    calculatedTotal += adminFee;
    calculatedTotal += Number(unique_code);

    // Generate Invoice No: INV/YYYYMM/001
    const periodStr = `${period_year}${String(period_month).padStart(2, '0')}`;
    const lastInvoice = await db("invoices")
      .whereRaw("invoice_no LIKE ?", [`INV/${periodStr}/%`])
      .orderBy("invoice_no", "desc")
      .first();

    let seq = 1;
    if (lastInvoice) {
      const lastSeq = parseInt(lastInvoice.invoice_no.split("/")[2]);
      seq = lastSeq + 1;
    }
    const invoiceNo = `INV/${periodStr}/${String(seq).padStart(3, '0')}`;

    const [invoice] = await db.transaction(async (trx) => {
      const [inv] = await trx("invoices").insert({
        invoice_no: invoiceNo,
        period: `${period_year}-${period_month}-01`,
        total_amount: calculatedTotal,
        unique_code: unique_code,
        status: "UNPAID",
      }).returning("*");

      const items = [];

      // Process PLN Groups
      for (const [sku, group] of Object.entries(plnGroups)) {
         const unitPrice = group.total / group.count; 
         items.push({
            invoice_id: inv.id,
            category: "PLN",
            description: `Pengajuan Saldo ${sku.toUpperCase()} - ${group.count} Stasiun`,
            quantity: group.count,
            unit_price: unitPrice,
            total_price: group.total
         });
      }

      // Process Orbit Groups
      for (const [sku, group] of Object.entries(orbitGroups)) {
         const unitPrice = group.total / group.count;
         items.push({
            invoice_id: inv.id,
            category: "ORBIT",
            description: `Pengajuan Paket Data ${sku.toUpperCase()} - ${group.count} Stasiun`,
            quantity: group.count,
            unit_price: unitPrice,
            total_price: group.total
         });
      }

      // Add Admin Fee
      items.push({
        invoice_id: inv.id,
        category: "ADMIN",
        description: "Biaya Admin Bank",
        quantity: 1,
        unit_price: adminFee,
        total_price: adminFee
      });

      // Add Unique Code
      if (unique_code > 0) {
        items.push({
          invoice_id: inv.id,
          category: "UNIQUE_CODE",
          description: "Kode Unik Transaksi",
          quantity: 1,
          unit_price: unique_code,
          total_price: unique_code
        });
      }

      await trx("invoice_items").insert(items);
      return [inv];
    });

    return NextResponse.json({ success: true, invoice });
  } catch (error: any) {
    console.error("Generate Invoice Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
