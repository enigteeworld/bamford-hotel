import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();

    if (!q) return NextResponse.json({ error: "q is required" }, { status: 400 });

    const sb = supabaseAdmin();

    // If it's UUID-ish, search by id, else by email (ilike)
    const isUuid = /^[0-9a-fA-F-]{20,}$/.test(q);

    let query = sb
      .from("bookings")
      .select(
        "id, full_name, email, check_in, check_out, rooms, adults, children, guests, currency, amount_kobo, payment_status, payment_provider, payment_reference, paid_at, created_at"
      )
      .limit(1);

    if (isUuid) query = query.eq("id", q);
    else query = query.ilike("email", `%${q}%`);

    const { data, error } = await query.maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ data: { booking: data ?? null } }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}