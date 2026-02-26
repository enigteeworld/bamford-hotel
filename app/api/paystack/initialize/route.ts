import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const booking_id = String(body.booking_id || "").trim();

    if (!booking_id) return NextResponse.json({ error: "booking_id is required" }, { status: 400 });

    const supabase = supabaseServer();

    const { data: booking, error } = await supabase
      .from("bookings")
      .select("id,email,amount_kobo,currency")
      .eq("id", booking_id)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    const secret = process.env.PAYSTACK_SECRET_KEY!;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const callback_url = `${siteUrl}/booking/confirm`;

    const reference = `BMF_${booking.id}_${Date.now()}`;

    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: booking.email,
        amount: booking.amount_kobo,
        currency: booking.currency || "NGN",
        reference,
        callback_url,
        metadata: { booking_id: booking.id },
      }),
    });

    const json = await res.json();
    if (!res.ok || !json?.status) {
      return NextResponse.json({ error: json?.message || "Paystack init failed" }, { status: 500 });
    }

    await supabase.from("bookings").update({ paystack_reference: reference }).eq("id", booking.id);

    return NextResponse.json({ data: json.data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}

