import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const users = await db("users").select("id", "username", "role", "created_at");
  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { username, password } = await req.json();

    const existing = await db("users").where("username", username).first();
    if (existing) {
      return NextResponse.json({ error: "Username already exists" }, { status: 400 });
    }

    await db("users").insert({
      username,
      password, // User requested plain text credential usage for now
      role: "user",
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
