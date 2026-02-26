import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const reference = String(searchParams.get("reference") || "").trim();
    if (!reference) return NextResponse.json({ error: "reference is required" }, { status: 400 });

    const secret = process.env.PAYSTACK_SECRET_KEY!;
    const supabase = supabaseServer();

    const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${secret}` },
    });

    const json = await res.json();
    if (!res.ok || !json?.status) {
      return NextResponse.json({ error: json?.message || "Paystack verify failed" }, { status: 500 });
    }

    const payStatus = json?.data?.status; // success, failed, abandoned...
    const booking_id = json?.data?.metadata?.booking_id;

    if (booking_id) {
      await supabase
        .from("bookings")
        .update({ payment_status: payStatus === "success" ? "paid" : "failed" })
        .eq("id", booking_id);
    }

    return NextResponse.json({ data: json.data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}

