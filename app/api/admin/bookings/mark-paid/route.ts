import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const bookingId = String(body.bookingId || "").trim();

    if (!bookingId) return NextResponse.json({ error: "bookingId is required" }, { status: 400 });

    const sb = supabaseAdmin();

    const { data: updated, error } = await sb
      .from("bookings")
      .update({
        payment_status: "paid",
        paid_at: new Date().toISOString(),
        payment_provider: "hotel",
        payment_reference: `hotel_${bookingId}_${Date.now()}`,
      })
      .eq("id", bookingId)
      .select(
        "id, full_name, email, check_in, check_out, rooms, adults, children, guests, currency, amount_kobo, payment_status, payment_provider, payment_reference, paid_at, created_at"
      )
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!updated) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    return NextResponse.json({ data: { booking: updated } }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}