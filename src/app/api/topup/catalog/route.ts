import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const brand = searchParams.get("brand");
    const q = searchParams.get("q");

    let query = db("topup_products")
      .leftJoin("topup_product_limits", "topup_products.id", "topup_product_limits.product_id")
      .select(
        "topup_products.*",
        "topup_product_limits.min_amount",
        "topup_product_limits.max_amount",
        "topup_product_limits.increment_amount"
      )
      .where("topup_products.is_active", true);

    if (category) {
      query = query.where("topup_products.category", category.toUpperCase());
    }

    if (brand && brand !== "ALL" && brand !== "UNKNOWN") {
      query = query.where("topup_products.brand", brand.toUpperCase());
    }

    if (q) {
      const sanitizedQ = `%${q.trim().toLowerCase()}%`;
      query = query.where((builder) => {
        builder
          .whereRaw("LOWER(topup_products.name) LIKE ?", [sanitizedQ])
          .orWhereRaw("LOWER(topup_products.sku) LIKE ?", [sanitizedQ])
          .orWhereRaw("LOWER(topup_products.brand) LIKE ?", [sanitizedQ]);
      });
    }

    const products = await query.orderBy("topup_products.catalog_price", "asc").orderBy("topup_products.name", "asc");

    return NextResponse.json({
      success: true,
      data: products.map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        category: p.category,
        brand: p.brand,
        flow_type: p.flow_type,
        nominal_type: p.nominal_type,
        catalog_price: Number(p.catalog_price),
        catalog_admin: Number(p.catalog_admin),
        catalog_commission: Number(p.catalog_commission),
        seller_name: p.seller_name,
        is_active: p.is_active,
        description: p.description,
        limits: p.min_amount
          ? {
              min_amount: Number(p.min_amount),
              max_amount: Number(p.max_amount),
              increment_amount: Number(p.increment_amount),
            }
          : null,
      })),
    });
  } catch (error: any) {
    console.error("Topup Catalog API Error:", error);
    return NextResponse.json({ success: false, error: "Gagal memuat katalog produk" }, { status: 500 });
  }
}
