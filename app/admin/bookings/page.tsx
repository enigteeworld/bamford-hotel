"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";

type Booking = {
  id: string;
  full_name: string | null;
  email: string | null;
  check_in: string;
  check_out: string;
  rooms: number | null;
  adults: number | null;
  children: number | null;
  guests: number | null;
  currency: string | null;
  amount_kobo: number | null;
  payment_status: string | null;
  payment_provider: string | null;
  payment_reference: string | null;
  paid_at: string | null;
  created_at: string | null;
};

function moneyKobo(amountKobo: number | null, currency: string | null) {
  if (!amountKobo) return "";
  const cur = currency || "NGN";
  const amount = amountKobo / 100;
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: cur,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${cur} ${amount.toLocaleString()}`;
  }
}

async function apiJson<T>(
  url: string,
  init?: RequestInit
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const res = await fetch(url, init);
    const text = await res.text();
    const json = text ? JSON.parse(text) : {};
    if (!res.ok) {
      return { ok: false, error: json?.error || json?.message || `Request failed (${res.status})` };
    }
    return { ok: true, data: json?.data ?? json };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Network error" };
  }
}

export default function AdminBookingsLookupPage() {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [markBusy, setMarkBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err" | "info"; text: string } | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);

  const canSearch = useMemo(() => q.trim().length >= 3, [q]);

  async function lookup() {
    setMsg(null);
    setBooking(null);

    if (!canSearch) {
      setMsg({ type: "err", text: "Enter a Booking ID or email (at least 3 characters)." });
      return;
    }

    setBusy(true);
    setMsg({ type: "info", text: "Searching…" });

    const res = await apiJson<{ booking: Booking | null }>(`/api/admin/bookings/lookup?q=${encodeURIComponent(q.trim())}`, {
      method: "GET",
    });

    setBusy(false);

    if (!res.ok) {
      setMsg({ type: "err", text: res.error });
      return;
    }

    if (!res.data?.booking) {
      setMsg({ type: "err", text: "No booking found for that query." });
      return;
    }

    setBooking(res.data.booking);
    setMsg({ type: "ok", text: "Booking found." });
  }

  async function markPaidAtHotel() {
    setMsg(null);

    if (!booking?.id) return;

    if (!confirm("Mark this booking as PAID (pay at hotel)?")) return;

    setMarkBusy(true);
    setMsg({ type: "info", text: "Updating booking…" });

    const res = await apiJson<{ booking: Booking }>(`/api/admin/bookings/mark-paid`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: booking.id }),
    });

    setMarkBusy(false);

    if (!res.ok) {
      setMsg({ type: "err", text: res.error });
      return;
    }

    setBooking(res.data.booking);
    setMsg({ type: "ok", text: "Marked as PAID." });
  }

  return (
    <main className="lux-container py-12 md:py-16">
      <div className="max-w-3xl">
        <div className="lux-kicker">Admin</div>
        <h1 className="mt-3 lux-h2">Booking Lookup</h1>
        <p className="mt-3 text-sm lux-muted">
          Search by <b>Booking ID</b> (UUID) or <b>email</b>. Use this at reception to confirm reservations.
        </p>

        <div className="mt-8 lux-border lux-card rounded-3xl bg-white p-6">
          {msg && (
            <div
              className={[
                "mb-5 rounded-2xl border px-4 py-3 text-sm",
                msg.type === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "",
                msg.type === "err" ? "border-red-200 bg-red-50 text-red-900" : "",
                msg.type === "info" ? "border-black/10 bg-black/[0.03] text-black/70" : "",
              ].join(" ")}
            >
              {msg.text}
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Booking ID or email…"
              className="w-full rounded-xl border border-[var(--line)] px-4 py-3 text-sm outline-none"
            />
            <Button
              onClick={lookup}
              disabled={busy || !canSearch}
              className="!px-6 !py-3 !text-xs !bg-[var(--primary)] !text-white hover:!bg-[var(--primary-2)] disabled:opacity-60"
            >
              {busy ? "Searching…" : "Search"}
            </Button>
          </div>

          {booking && (
            <div className="mt-6 rounded-2xl border border-[var(--line)] p-5">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.25em] text-black/50">Booking ID</div>
                  <div className="mt-1 font-semibold break-all">{booking.id}</div>
                  <div className="mt-3 text-sm">
                    <div className="text-black/60">Guest</div>
                    <div className="font-medium">{booking.full_name || "—"}</div>
                    <div className="mt-2 text-black/60">Email</div>
                    <div className="font-medium">{booking.email || "—"}</div>
                  </div>
                </div>

                <div className="text-sm">
                  <div className="text-black/60">Payment</div>
                  <div className="mt-1 font-semibold">{moneyKobo(booking.amount_kobo, booking.currency)}</div>
                  <div className="mt-2 text-black/60">Status</div>
                  <div className="font-semibold">{String(booking.payment_status || "unpaid").toUpperCase()}</div>
                  {booking.paid_at ? (
                    <>
                      <div className="mt-2 text-black/60">Paid at</div>
                      <div className="font-medium">{new Date(booking.paid_at).toLocaleString()}</div>
                    </>
                  ) : null}
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <div className="text-black/60">Check-in</div>
                  <div className="font-medium">{booking.check_in}</div>
                </div>
                <div>
                  <div className="text-black/60">Check-out</div>
                  <div className="font-medium">{booking.check_out}</div>
                </div>
                <div>
                  <div className="text-black/60">Rooms</div>
                  <div className="font-medium">{booking.rooms ?? 1}</div>
                </div>
                <div>
                  <div className="text-black/60">Guests</div>
                  <div className="font-medium">
                    {booking.adults ?? 0}A / {booking.children ?? 0}C
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  href={`/booking/${booking.id}`}
                  className="!bg-[var(--primary)] !text-white hover:!bg-[var(--primary-2)]"
                >
                  View Slip
                </Button>

                <Button
                  onClick={markPaidAtHotel}
                  disabled={markBusy || String(booking.payment_status || "").toLowerCase() === "paid"}
                  className="!bg-[var(--accent)] !text-white hover:!bg-[var(--accent-2)] disabled:opacity-60"
                >
                  {markBusy ? "Updating…" : "Mark Paid (Pay at hotel)"}
                </Button>
              </div>

              <div className="mt-4 text-[12px] text-black/55">
                Tip: If guest pays cash/transfer at reception, click <b>Mark Paid</b> then print the slip for them.
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}