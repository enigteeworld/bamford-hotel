// app/api/payments/verify/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function toBase64(s: string) {
  return Buffer.from(s).toString("base64");
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const provider = (searchParams.get("provider") || "").toLowerCase();
    const bookingId = (searchParams.get("bookingId") || "").trim();
    const reference = (searchParams.get("reference") || "").trim();

    if (!provider || !bookingId || !reference) {
      return NextResponse.json(
        { ok: false, status: "failed", bookingId, message: "Missing params" },
        { status: 400 }
      );
    }

    const sb = supabaseAdmin();

    const { data: booking, error: bErr } = await sb
      .from("bookings")
      .select("id, payment_reference, payment_status, payment_provider")
      .eq("id", bookingId)
      .maybeSingle();

    if (bErr) {
      return NextResponse.json(
        { ok: false, status: "failed", bookingId, message: bErr.message },
        { status: 500 }
      );
    }
    if (!booking) {
      return NextResponse.json(
        { ok: false, status: "failed", bookingId, message: "Booking not found" },
        { status: 404 }
      );
    }

    // If already paid, be idempotent
    if (String(booking.payment_status || "").toLowerCase() === "paid") {
      return NextResponse.json({ ok: true, status: "paid", bookingId });
    }

    // Strong check: if we stored a reference, it must match
    if (booking.payment_reference && booking.payment_reference !== reference) {
      return NextResponse.json(
        { ok: false, status: "failed", bookingId, message: "Reference mismatch" },
        { status: 400 }
      );
    }

    // Provider mismatch check (optional but good)
    if (booking.payment_provider && String(booking.payment_provider).toLowerCase() !== provider) {
      // Don’t hard fail, but it’s suspicious. You can enforce if you want.
      // For now, enforce:
      return NextResponse.json(
        { ok: false, status: "failed", bookingId, message: "Provider mismatch" },
        { status: 400 }
      );
    }

    if (provider === "paystack") {
      const secret = mustEnv("PAYSTACK_SECRET_KEY");

      const resp = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${secret}` },
        }
      );
      const j = await resp.json();

      const paid = resp.ok && j?.status && j?.data?.status === "success";

      if (paid) {
        await sb
          .from("bookings")
          .update({
            payment_status: "paid",
            payment_provider: "paystack",
            payment_reference: reference,
            paid_at: new Date().toISOString(),
          })
          .eq("id", bookingId);

        return NextResponse.json({ ok: true, status: "paid", bookingId });
      }

      await sb
        .from("bookings")
        .update({
          payment_status: "failed",
          payment_provider: "paystack",
          payment_reference: reference,
        })
        .eq("id", bookingId);

      return NextResponse.json({
        ok: false,
        status: "failed",
        bookingId,
        message: j?.message || "Payment not confirmed",
      });
    }

    if (provider === "monnify") {
      const baseUrl = mustEnv("MONNIFY_BASE_URL");
      const apiKey = mustEnv("MONNIFY_API_KEY");
      const secretKey = mustEnv("MONNIFY_SECRET_KEY");

      const login = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${toBase64(`${apiKey}:${secretKey}`)}`,
        },
      });
      const loginJson = await login.json();
      const token = loginJson?.responseBody?.accessToken;

      if (!token) {
        return NextResponse.json(
          { ok: false, status: "failed", bookingId, message: "Monnify auth failed" },
          { status: 500 }
        );
      }

      const resp = await fetch(
        `${baseUrl}/api/v1/merchant/transactions/query?paymentReference=${encodeURIComponent(reference)}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const j = await resp.json();
      const paymentStatus = String(j?.responseBody?.paymentStatus || "").toUpperCase();
      const paid = resp.ok && (paymentStatus === "PAID" || paymentStatus === "PAID_SUCCESSFUL");

      if (paid) {
        await sb
          .from("bookings")
          .update({
            payment_status: "paid",
            payment_provider: "monnify",
            payment_reference: reference,
            paid_at: new Date().toISOString(),
          })
          .eq("id", bookingId);

        return NextResponse.json({ ok: true, status: "paid", bookingId });
      }

      await sb
        .from("bookings")
        .update({
          payment_status: "failed",
          payment_provider: "monnify",
          payment_reference: reference,
        })
        .eq("id", bookingId);

      return NextResponse.json({
        ok: false,
        status: "failed",
        bookingId,
        message: j?.responseMessage || "Payment not confirmed",
      });
    }

    return NextResponse.json(
      { ok: false, status: "failed", bookingId, message: "Invalid provider" },
      { status: 400 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, status: "failed", message: e?.message || "Server error" },
      { status: 500 }
    );
  }
}