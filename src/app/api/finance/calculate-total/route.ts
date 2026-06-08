import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { selected_orbit_ids = [] } = await req.json();
    
    // 1. Get PLN assets
    const plnAssets = await db("assets_pln")
      .leftJoin("digiflazz_products", "assets_pln.default_sku", "digiflazz_products.buyer_sku_code")
      .select("digiflazz_products.price", "assets_pln.default_sku");
    
    // 2. Get Selected Orbit assets
    let orbitAssets: any[] = [];
    if (selected_orbit_ids && selected_orbit_ids.length > 0) {
      orbitAssets = await db("assets_orbit")
        .leftJoin("digiflazz_products", "assets_orbit.default_sku", "digiflazz_products.buyer_sku_code")
        .whereIn("assets_orbit.id", selected_orbit_ids)
        .select("digiflazz_products.price", "assets_orbit.default_sku");
    }

    const calculateGroupTotal = (assets: any[]) => {
      let total = 0;
      for (const asset of assets) {
        const sku = asset.default_sku || 'unknown';
        const price = Number(asset.price || (sku.startsWith('pln') ? 100000 : 135000));
        const roundedUp = Math.ceil(price / 1000) * 1000;
        total += roundedUp;
      }
      return total;
    };

    const plnTotal = calculateGroupTotal(plnAssets);
    const orbitTotal = calculateGroupTotal(orbitAssets);
    const adminFee = 1332;

    return NextResponse.json({ 
      success: true, 
      data: {
        plnTotal,
        orbitTotal,
        adminFee
      }
    });
  } catch (error: any) {
    console.error("Calculate Total Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
