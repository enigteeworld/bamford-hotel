// app/api/admin/login/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminSessionToken } from "@/lib/adminAuth";

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const username = String(body?.username || "").trim();
    const password = String(body?.password || "");

    const adminUser = mustEnv("ADMIN_USER");
    const adminPassword = mustEnv("ADMIN_PASSWORD");

    if (!username || !password || username !== adminUser || password !== adminPassword) {
      return NextResponse.json({ ok: false, error: "Invalid credentials" }, { status: 401 });
    }

    // Token TTL should match cookie maxAge (7 days)
    const token = await createAdminSessionToken({
      user: adminUser,
      ttlSeconds: 60 * 60 * 24 * 7,
    });

    const jar = await cookies(); // Next 16 allows awaiting cookies()
    jar.set("admin_session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}