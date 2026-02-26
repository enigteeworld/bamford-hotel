// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { verifyAdminSessionToken } from "@/lib/adminAuth";

function loginRedirect(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.searchParams.set("next", req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.redirect(url);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow admin login page + auth endpoints + Next assets
  if (
    pathname === "/admin/login" ||
    pathname.startsWith("/api/admin/login") ||
    pathname.startsWith("/api/admin/logout") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico")
  ) {
    return NextResponse.next();
  }

  // Protect /admin/*
  if (pathname.startsWith("/admin")) {
    const secret = process.env.ADMIN_SESSION_SECRET || "";
    const adminUser = process.env.ADMIN_USER || "";
    const adminPass = process.env.ADMIN_PASSWORD || "";

    // If not configured, keep admin locked down
    if (!secret || !adminUser || !adminPass) return loginRedirect(req);

    const token = req.cookies.get("admin_session")?.value;
    if (!token) return loginRedirect(req);

    const v = await verifyAdminSessionToken(token);
    if (!v.ok) return loginRedirect(req);

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};