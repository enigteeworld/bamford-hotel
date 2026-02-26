// app/api/payments/init/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type Body = {
  bookingId: string;
  provider: "paystack" | "monnify";
};

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function toBase64(s: string) {
  return Buffer.from(s).toString("base64");
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const bookingId = (body.bookingId || "").trim();
    const provider = (body.provider || "").trim().toLowerCase() as Body["provider"];

    if (!bookingId) return NextResponse.json({ ok: false, error: "bookingId required" }, { status: 400 });
    if (provider !== "paystack" && provider !== "monnify") {
      return NextResponse.json({ ok: false, error: "Invalid provider" }, { status: 400 });
    }

    const sb = supabaseAdmin();

    const { data: booking, error: bErr } = await sb
      .from("bookings")
      .select("id, room_id, check_in, check_out, rooms, email, full_name, amount_kobo, currency, payment_status")
      .eq("id", bookingId)
      .maybeSingle();

    if (bErr) return NextResponse.json({ ok: false, error: bErr.message }, { status: 500 });
    if (!booking) return NextResponse.json({ ok: false, error: "Booking not found" }, { status: 404 });

    if (String(booking.payment_status || "").toLowerCase() === "paid") {
      return NextResponse.json({ ok: false, error: "Booking already paid." }, { status: 400 });
    }

    let amountKobo = Number(booking.amount_kobo || 0);
    let currency = (booking.currency || "NGN").toString();

    if (!amountKobo || amountKobo < 100) {
      const { data: room, error: rErr } = await sb
        .from("rooms")
        .select("price_per_night,currency")
        .eq("id", booking.room_id)
        .maybeSingle();

      if (rErr) return NextResponse.json({ ok: false, error: rErr.message }, { status: 500 });

      const price = Number(room?.price_per_night || 0);
      currency = (room?.currency || currency || "NGN").toString();

      const a = new Date(String(booking.check_in) + "T00:00:00");
      const b = new Date(String(booking.check_out) + "T00:00:00");
      const nights = Math.max(1, Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)));
      const roomsCount = Number((booking as any).rooms || 1);

      amountKobo = Math.round(price * nights * roomsCount * 100);

      await sb.from("bookings").update({ amount_kobo: amountKobo, currency }).eq("id", bookingId);
    }

    // Unique reference we control
    const reference = `${provider}_${bookingId}_${Date.now()}`;

    // Mark pending
    await sb
      .from("bookings")
      .update({
        payment_status: "pending",
        payment_provider: provider,
        payment_reference: reference,
      })
      .eq("id", bookingId);

    if (provider === "paystack") {
      const secret = mustEnv("PAYSTACK_SECRET_KEY");
      // Should be your site URL + "/payment/return"
      const callbackUrl = mustEnv("PAYSTACK_CALLBACK_URL");

      const resp = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: booking.email,
          amount: amountKobo,
          reference,
          currency,
          callback_url: `${callbackUrl}?provider=paystack&bookingId=${bookingId}`,
          metadata: {
            bookingId,
            full_name: booking.full_name,
          },
        }),
      });

      const j = await resp.json();
      if (!resp.ok || !j?.status) {
        return NextResponse.json({ ok: false, error: j?.message || "Paystack init failed" }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        provider: "paystack",
        reference,
        checkoutUrl: j.data.authorization_url,
      });
    }

    // ----------------- MONNIFY -----------------
    const baseUrl = mustEnv("MONNIFY_BASE_URL");
    const apiKey = mustEnv("MONNIFY_API_KEY");
    const secretKey = mustEnv("MONNIFY_SECRET_KEY");
    const contractCode = mustEnv("MONNIFY_CONTRACT_CODE");
    const callbackUrl = mustEnv("MONNIFY_CALLBACK_URL");

    const login = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${toBase64(`${apiKey}:${secretKey}`)}`,
      },
    });
    const loginJson = await login.json();
    const token = loginJson?.responseBody?.accessToken;
    if (!token) return NextResponse.json({ ok: false, error: "Monnify auth failed" }, { status: 500 });

    const amountNaira = Number(amountKobo) / 100;

    const init = await fetch(`${baseUrl}/api/v1/merchant/transactions/init-transaction`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amountNaira,
        customerName: booking.full_name,
        customerEmail: booking.email,
        paymentReference: reference,
        paymentDescription: `Hotel booking (${bookingId})`,
        currencyCode: currency,
        contractCode,
        redirectUrl: `${callbackUrl}?provider=monnify&bookingId=${bookingId}`,
        paymentMethods: ["CARD", "ACCOUNT_TRANSFER"],
      }),
    });

    const initJson = await init.json();
    const checkoutUrl = initJson?.responseBody?.checkoutUrl?.toString();

    if (!checkoutUrl) {
      return NextResponse.json({ ok: false, error: initJson?.responseMessage || "Monnify init failed" }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      provider: "monnify",
      reference,
      checkoutUrl,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}