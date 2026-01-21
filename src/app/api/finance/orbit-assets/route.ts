import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    const assets = await db("assets_orbit").select("id", "nama_stasiun", "phone_number").orderBy("nama_stasiun", "asc");
    return NextResponse.json(assets);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
