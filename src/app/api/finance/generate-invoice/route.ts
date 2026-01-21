import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { period_month, period_year, selected_orbit_ids } = await req.json();
    // 1. Get PLN assets joined with digiflazz_products to get current prices
    const plnAssets = await db("assets_pln")
      .leftJoin("digiflazz_products", "assets_pln.default_sku", "digiflazz_products.buyer_sku_code")
      .select("digiflazz_products.price");
    
    const plnCount = plnAssets.length;
    // Round UP each price to nearest 1.000 (e.g. 99.800 -> 100.000)
    const totalPln = plnAssets.reduce((acc, asset) => {
      const price = Number(asset.price || 100000);
      const roundedUp = Math.ceil(price / 1000) * 1000;
      return acc + roundedUp;
    }, 0);

    // 2. Get Selected Orbit assets joined with digiflazz_products
    const orbitAssets = await db("assets_orbit")
      .leftJoin("digiflazz_products", "assets_orbit.default_sku", "digiflazz_products.buyer_sku_code")
      .whereIn("assets_orbit.id", selected_orbit_ids)
      .select("digiflazz_products.price");
    
    const orbitCount = orbitAssets.length;
    const totalOrbit = orbitAssets.reduce((acc, asset) => {
      const price = Number(asset.price || 135000);
      const roundedUp = Math.ceil(price / 1000) * 1000;
      return acc + roundedUp;
    }, 0);

    if (plnCount === 0 && orbitCount === 0) {
      return NextResponse.json({ error: "Tidak ada aset untuk diajukan." }, { status: 400 });
    }

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

    const grandTotal = totalPln + totalOrbit;

    const [invoice] = await db.transaction(async (trx) => {
      const [inv] = await trx("invoices").insert({
        invoice_no: invoiceNo,
        period: `${period_year}-${period_month}-01`,
        total_amount: grandTotal,
        status: "UNPAID",
      }).returning("*");

      const items = [];
      if (plnCount > 0) {
        items.push({
          invoice_id: inv.id,
          category: "PLN",
          description: `Pengajuan Saldo Token Listrik - ${plnCount} Aset`,
          quantity: plnCount,
          unit_price: plnCount > 0 ? (totalPln / plnCount) : 0, // Average or show as total item
          total_price: totalPln
        });
      }

      if (orbitCount > 0) {
        items.push({
          invoice_id: inv.id,
          category: "ORBIT",
          description: `Pengajuan Paket Data Orbit - ${orbitCount} Aset Terpilih`,
          quantity: orbitCount,
          unit_price: orbitCount > 0 ? (totalOrbit / orbitCount) : 0,
          total_price: totalOrbit
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
