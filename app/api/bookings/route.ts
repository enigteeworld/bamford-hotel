import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

function nightsBetween(checkIn: string, checkOut: string) {
  const a = new Date(checkIn + "T00:00:00");
  const b = new Date(checkOut + "T00:00:00");
  const ms = b.getTime() - a.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function clampInt(v: any, fallback: number, min: number, max: number) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function makeBookingCode(prefix = "BAMF") {
  // short, readable code (no 0/O, 1/I)
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let s = "";
  for (let i = 0; i < 5; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `${prefix}-${s}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const room_id = String(body.room_id || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const full_name = String(body.full_name || "").trim();

    const check_in = String(body.check_in || "").trim();
    const check_out = String(body.check_out || "").trim();

    const rooms = clampInt(body.rooms, 1, 1, 5);
    const adults = clampInt(body.adults, 1, 1, 20);
    const children = clampInt(body.children, 0, 0, 20);
    const guests = adults + children;

    if (!room_id) return NextResponse.json({ error: "room_id is required" }, { status: 400 });
    if (!full_name) return NextResponse.json({ error: "full_name is required" }, { status: 400 });
    if (!email) return NextResponse.json({ error: "email is required" }, { status: 400 });
    if (!check_in || !check_out) {
      return NextResponse.json({ error: "check_in and check_out are required" }, { status: 400 });
    }

    const nights = nightsBetween(check_in, check_out);
    if (!Number.isFinite(nights) || nights < 1 || nights > 30) {
      return NextResponse.json(
        { error: "Invalid dates. check_out must be after check_in (max 30 nights)." },
        { status: 400 }
      );
    }

    const supabase = supabaseServer();

    // get room price
    const { data: room, error: roomErr } = await supabase
      .from("rooms")
      .select("price_per_night,currency")
      .eq("id", room_id)
      .maybeSingle();

    if (roomErr) return NextResponse.json({ error: roomErr.message }, { status: 500 });
    if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

    const price = Number(room.price_per_night || 0);
    const currency = String(room.currency || "NGN");
    const total = price * nights * rooms;
    const amount_kobo = Math.round(total * 100);

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const booking_code = makeBookingCode("BAMF");

    const { data: booking, error: bookErr } = await supabase
      .from("bookings")
      .insert({
        room_id,
        check_in,
        check_out,
        guests,
        full_name,
        email,
        rooms,
        adults,
        children,
        currency,
        amount_kobo,
        payment_status: "unpaid",
        payment_method: "online",
        booking_code,
        expires_at: expiresAt,
      })
      .select("*")
      .maybeSingle();

    if (bookErr) return NextResponse.json({ error: bookErr.message }, { status: 500 });

    return NextResponse.json({ data: booking }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}