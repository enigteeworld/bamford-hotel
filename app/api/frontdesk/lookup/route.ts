import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = String(searchParams.get("q") || "").trim();

    const key = req.headers.get("x-frontdesk-key") || "";
    const expected = process.env.FRONTDESK_LOOKUP_KEY || "";

    if (!expected || key !== expected) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!q) return NextResponse.json({ error: "Missing query" }, { status: 400 });

    const sb = supabaseAdmin();

    const { data, error } = await sb
      .from("bookings")
      .select("id,booking_code,full_name,email,check_in,check_out,rooms,adults,children,guests,amount_kobo,currency,payment_status,payment_method,expires_at,paid_at")
      .or(`id.eq.${q},booking_code.eq.${q}`)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    return NextResponse.json({ data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}