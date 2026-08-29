import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { nama_stasiun, operator_wa, pln_id, orbit_id } = await req.json();

    if (!nama_stasiun && !pln_id && !orbit_id) {
      return NextResponse.json({ error: "Identitas stasiun wajib disertakan" }, { status: 400 });
    }

    const cleanWa = typeof operator_wa === "string" ? operator_wa.trim() : "";

    // Update in assets_pln
    if (pln_id) {
      await db("assets_pln").where("id", pln_id).update({ operator_wa: cleanWa });
    } else if (nama_stasiun) {
      await db("assets_pln").where("nama_stasiun", nama_stasiun).update({ operator_wa: cleanWa });
    }

    // Update in assets_orbit
    if (orbit_id) {
      await db("assets_orbit").where("id", orbit_id).update({ operator_wa: cleanWa });
    } else if (nama_stasiun) {
      await db("assets_orbit").where("nama_stasiun", nama_stasiun).update({ operator_wa: cleanWa });
    }

    return NextResponse.json({
      success: true,
      message: `Nomor WA operator untuk stasiun ${nama_stasiun || ""} berhasil diperbarui.`,
    });
  } catch (error: any) {
    console.error("[Update Operator WA] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to update operator WA" }, { status: 500 });
  }
}

