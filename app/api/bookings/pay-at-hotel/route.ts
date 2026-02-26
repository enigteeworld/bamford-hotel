import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const bookingId = String(body.bookingId || "").trim();
    if (!bookingId) return NextResponse.json({ error: "bookingId required" }, { status: 400 });

    const supabase = supabaseServer();

    const { data, error } = await supabase
      .from("bookings")
      .update({ payment_method: "hotel", payment_status: "unpaid" })
      .eq("id", bookingId)
      .select("*")
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}