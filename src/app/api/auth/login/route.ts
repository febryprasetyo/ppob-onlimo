import { NextResponse } from "next/server";
import db from "@/lib/db";
import { login } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    const user = await db("users").where("username", username).first();

    if (!user || user.password !== password) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    await login(user.username, user.role);

    return NextResponse.json({ success: true, role: user.role });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
