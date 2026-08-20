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
    const status = searchParams.get("status");
    const q = searchParams.get("q");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));
    const offset = (page - 1) * limit;

    let query = db("topup_transactions");

    if (category && category !== "ALL") {
      query = query.where("category", category.toUpperCase());
    }

    if (status && status !== "ALL") {
      query = query.where("status", status.toUpperCase());
    }

    if (startDate) {
      query = query.where("created_at", ">=", `${startDate} 00:00:00`);
    }

    if (endDate) {
      query = query.where("created_at", "<=", `${endDate} 23:59:59`);
    }

    if (q) {
      const sanitizedQ = `%${q.trim().toLowerCase()}%`;
      query = query.where((builder) => {
        builder
          .whereRaw("LOWER(reference) LIKE ?", [sanitizedQ])
          .orWhereRaw("customer_target LIKE ?", [`%${q.trim()}%`])
          .orWhereRaw("LOWER(operator_username) LIKE ?", [sanitizedQ])
          .orWhereRaw("LOWER(serial_number) LIKE ?", [sanitizedQ]);
      });
    }

    // Count total rows
    const totalCountQuery = query.clone().count("* as cnt").first();
    const totalCountRes = await totalCountQuery;
    const total = Number(totalCountRes?.cnt || 0);

    // Fetch paginated rows
    const rows = await query
      .select("*")
      .orderBy("created_at", "desc")
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data: rows.map((tx) => ({
        reference: tx.reference,
        category: tx.category,
        flow_type: tx.flow_type,
        customer_target: tx.customer_target,
        product_snapshot: typeof tx.product_snapshot === "string" ? JSON.parse(tx.product_snapshot) : tx.product_snapshot,
        final_price: Number(tx.final_price_snapshot),
        deposit_price: session.role === "admin" ? Number(tx.deposit_price_snapshot) : undefined,
        admin_fee: Number(tx.admin_snapshot),
        commission: session.role === "admin" ? Number(tx.commission_snapshot) : undefined,
        status: tx.status,
        operator_username: tx.operator_username,
        serial_number: tx.serial_number,
        token: tx.token,
        supplier_message: tx.supplier_message,
        submitted_at: tx.submitted_at,
        completed_at: tx.completed_at,
        created_at: tx.created_at,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Topup Transactions List Error:", error);
    return NextResponse.json({ success: false, error: "Gagal memuat riwayat transaksi" }, { status: 500 });
  }
}
