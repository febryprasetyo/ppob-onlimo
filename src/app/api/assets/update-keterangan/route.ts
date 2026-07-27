import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { asset_id, type, keterangan } = await req.json();

    if (!asset_id || !type) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    const tableName = type === "pln" ? "assets_pln" : "assets_orbit";

    await db(tableName)
      .where("id", asset_id)
      .update({ keterangan: keterangan || "" });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
