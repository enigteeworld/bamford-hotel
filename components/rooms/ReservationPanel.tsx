"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

type ReservationPanelProps = {
  roomId: string;
  pricePerNight: number | null;
  currency: string | null;
  maxGuests: number | null;
  extras: string[];
  initial: {
    checkIn?: string;
    checkOut?: string;
    rooms?: string;
    adults?: string;
    children?: string;
  };
};

function money(n: number | null, currency: string | null) {
  if (n == null) return "";
  const cur = currency || "NGN";
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: cur,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${cur} ${Number(n).toLocaleString()}`;
  }
}

function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function clampInt(v: any, fallback: number, min: number, max: number) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function nightsBetween(checkIn: string, checkOut: string) {
  const a = new Date(checkIn + "T00:00:00");
  const b = new Date(checkOut + "T00:00:00");
  const ms = b.getTime() - a.getTime();
  const nights = Math.round(ms / (1000 * 60 * 60 * 24));
  return Number.isFinite(nights) ? nights : 0;
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
      return {
        ok: false,
        error:
          json?.error || json?.message || `Request failed (${res.status})`,
      };
    }
    return { ok: true, data: json?.data ?? json };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Network error" };
  }
}

export default function ReservationPanel(props: ReservationPanelProps) {
  const router = useRouter();

  const today = useMemo(() => new Date(), []);
  const tomorrow = useMemo(
    () => new Date(Date.now() + 24 * 60 * 60 * 1000),
    []
  );

  const maxAdults = Math.max(1, props.maxGuests ?? 10);

  // ---------- controlled state ----------
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  const [checkIn, setCheckIn] = useState(
    props.initial.checkIn || toISODate(today)
  );
  const [checkOut, setCheckOut] = useState(
    props.initial.checkOut || toISODate(tomorrow)
  );

  const [rooms, setRooms] = useState(clampInt(props.initial.rooms, 1, 1, 5));
  const [adults, setAdults] = useState(
    clampInt(props.initial.adults, 2, 1, maxAdults)
  );
  const [children, setChildren] = useState(
    clampInt(props.initial.children, 0, 0, 10)
  );

  const [busy, setBusy] = useState(false);
  const [payBusy, setPayBusy] = useState<
    null | "paystack" | "monnify" | "hotel"
  >(null);

  const [msg, setMsg] = useState<{
    type: "ok" | "err" | "info";
    text: string;
  } | null>(null);

  // booking created result
  const [bookingId, setBookingId] = useState<string | null>(null);

  // ---------- “don’t overwrite user edits” tracking ----------
  const dirty = useRef({
    checkIn: false,
    checkOut: false,
    rooms: false,
    adults: false,
    children: false,
  });

  useEffect(() => {
    const ini = props.initial || {};
    if (
      !dirty.current.checkIn &&
      typeof ini.checkIn === "string" &&
      ini.checkIn.trim()
    )
      setCheckIn(ini.checkIn.trim());
    if (
      !dirty.current.checkOut &&
      typeof ini.checkOut === "string" &&
      ini.checkOut.trim()
    )
      setCheckOut(ini.checkOut.trim());
    if (
      !dirty.current.rooms &&
      typeof ini.rooms === "string" &&
      ini.rooms.trim()
    )
      setRooms(clampInt(ini.rooms, 1, 1, 5));
    if (
      !dirty.current.adults &&
      typeof ini.adults === "string" &&
      ini.adults.trim()
    )
      setAdults(clampInt(ini.adults, 2, 1, maxAdults));
    if (
      !dirty.current.children &&
      typeof ini.children === "string" &&
      ini.children.trim()
    )
      setChildren(clampInt(ini.children, 0, 0, 10));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    props.initial?.checkIn,
    props.initial?.checkOut,
    props.initial?.rooms,
    props.initial?.adults,
    props.initial?.children,
    maxAdults,
  ]);

  const nights = useMemo(() => nightsBetween(checkIn, checkOut), [checkIn, checkOut]);
  const validDates = useMemo(() => nights >= 1 && nights <= 30, [nights]);

  const total = useMemo(() => {
    const p = props.pricePerNight ?? 0;
    if (!validDates) return 0;
    return p * nights * rooms;
  }, [props.pricePerNight, validDates, nights, rooms]);

  const canCreateBooking = useMemo(() => {
    if (!validDates) return false;
    if (!props.roomId) return false;
    if (!email.trim()) return false;
    if (!fullName.trim()) return false;
    return true;
  }, [validDates, props.roomId, email, fullName]);

  async function createBooking() {
    setMsg(null);
    setBookingId(null);

    if (!canCreateBooking) {
      if (!fullName.trim())
        setMsg({ type: "err", text: "Please enter your full name." });
      else if (!email.trim())
        setMsg({ type: "err", text: "Please enter your email." });
      else if (!validDates)
        setMsg({
          type: "err",
          text: "Invalid date range. Check-out must be after check-in.",
        });
      return;
    }

    setBusy(true);
    setMsg({ type: "info", text: "Creating reservation…" });

    const res = await apiJson<any>("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        room_id: props.roomId,
        check_in: checkIn,
        check_out: checkOut,
        rooms,
        adults,
        children,
        email: email.trim().toLowerCase(),
        full_name: fullName.trim(),
      }),
    });

    setBusy(false);

    if (!res.ok) {
      setMsg({ type: "err", text: res.error });
      return;
    }

    const id = res.data?.id;
    if (id) setBookingId(id);

    // keep params in URL for refresh
    const q = new URLSearchParams({
      checkIn,
      checkOut,
      rooms: String(rooms),
      adults: String(adults),
      children: String(children),
    });
    router.replace(`?${q.toString()}`);

    setMsg({
      type: "ok",
      text: `Reservation created. Booking ID: ${
        id || "(no id returned)"
      }. Choose payment method below.`,
    });
  }

  async function startPayment(provider: "paystack" | "monnify") {
    setMsg(null);

    if (!bookingId) {
      setMsg({
        type: "err",
        text: "Create a reservation first to get a Booking ID.",
      });
      return;
    }

    setPayBusy(provider);
    setMsg({ type: "info", text: `Opening ${provider} checkout…` });

    const res = await apiJson<any>("/api/payments/init", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, provider }),
    });

    setPayBusy(null);

    if (!res.ok) {
      setMsg({ type: "err", text: res.error });
      return;
    }

    const checkoutUrl = res.data?.checkoutUrl;
    if (!checkoutUrl) {
      setMsg({ type: "err", text: "No checkout URL returned." });
      return;
    }

    window.location.href = checkoutUrl;
  }

  async function setPayAtHotel() {
    setMsg(null);

    if (!bookingId) {
      setMsg({
        type: "err",
        text: "Create a reservation first to get a Booking ID.",
      });
      return;
    }

    setPayBusy("hotel");
    setMsg({ type: "info", text: "Setting reservation to Pay at Hotel…" });

    const res = await apiJson<any>("/api/bookings/pay-at-hotel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId }),
    });

    setPayBusy(null);

    if (!res.ok) {
      setMsg({ type: "err", text: res.error });
      return;
    }

    setMsg({
      type: "ok",
      text: `Pay at Hotel selected. Your Booking ID is ${bookingId}. Please present it at reception within 24 hours.`,
    });
  }

  // White text in native inputs
  const inputStyle = useMemo(
    () =>
      ({
        color: "#fff",
        WebkitTextFillColor: "#fff",
        colorScheme: "dark",
      }) as React.CSSProperties,
    []
  );

  return (
    <aside
      className="lux-border rounded-3xl overflow-hidden text-white lg:sticky lg:top-24"
      style={{ backgroundColor: "#2f2f2f" }}
    >
      <div className="p-6 border-b border-white/10 text-center">
        <div className="text-sm uppercase tracking-[0.25em] text-white/85">
          Reservation
        </div>
      </div>

      {msg && (
        <div
          className={[
            "mx-6 mt-6 rounded-2xl border px-4 py-3 text-sm",
            msg.type === "ok"
              ? "border-emerald-200/30 bg-emerald-500/10 text-emerald-50"
              : "",
            msg.type === "err"
              ? "border-red-200/30 bg-red-500/10 text-red-50"
              : "",
            msg.type === "info"
              ? "border-white/10 bg-white/5 text-white/80"
              : "",
          ].join(" ")}
        >
          {msg.text}
        </div>
      )}

      <div className="p-6 grid gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.25em] text-white/60">
            Full Name
          </div>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your full name"
            className="mt-2 w-full rounded-xl bg-white/10 border border-white/15 px-3 py-3 text-sm outline-none text-white placeholder:text-white/45"
            style={inputStyle}
          />
        </div>

        <div>
          <div className="text-[11px] uppercase tracking-[0.25em] text-white/60">
            Email
          </div>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="mt-2 w-full rounded-xl bg-white/10 border border-white/15 px-3 py-3 text-sm outline-none text-white placeholder:text-white/45"
            style={inputStyle}
          />
        </div>

        <div>
          <div className="text-[11px] uppercase tracking-[0.25em] text-white/60">
            Check-in
          </div>
          <input
            type="date"
            value={checkIn}
            onChange={(e) => {
              dirty.current.checkIn = true;
              setCheckIn(e.target.value);
            }}
            className="mt-2 w-full rounded-xl bg-white/10 border border-white/15 px-3 py-3 text-sm outline-none text-white"
            style={inputStyle}
          />
        </div>

        <div>
          <div className="text-[11px] uppercase tracking-[0.25em] text-white/60">
            Check-out
          </div>
          <input
            type="date"
            value={checkOut}
            onChange={(e) => {
              dirty.current.checkOut = true;
              setCheckOut(e.target.value);
            }}
            className="mt-2 w-full rounded-xl bg-white/10 border border-white/15 px-3 py-3 text-sm outline-none text-white"
            style={inputStyle}
          />
          {!validDates && (
            <div className="mt-2 text-[12px] text-red-200/90">
              Check-out must be after check-in.
            </div>
          )}
        </div>

        <div>
          <div className="text-[11px] uppercase tracking-[0.25em] text-white/60">
            Rooms
          </div>
          <select
            value={rooms}
            onChange={(e) => {
              dirty.current.rooms = true;
              setRooms(clampInt(e.target.value, 1, 1, 5));
            }}
            className="mt-2 w-full rounded-xl bg-white/10 border border-white/15 px-3 py-3 text-sm outline-none text-white"
            style={inputStyle}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n} className="bg-[#2f2f2f] text-white">
                {n}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.25em] text-white/60">
              Adults
            </div>
            <select
              value={adults}
              onChange={(e) => {
                dirty.current.adults = true;
                setAdults(clampInt(e.target.value, 1, 1, maxAdults));
              }}
              className="mt-2 w-full rounded-xl bg-white/10 border border-white/15 px-3 py-3 text-sm outline-none text-white"
              style={inputStyle}
            >
              {Array.from({ length: maxAdults }, (_, k) => k + 1).map((n) => (
                <option key={n} value={n} className="bg-[#2f2f2f] text-white">
                  {n}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-[0.25em] text-white/60">
              Children
            </div>
            <select
              value={children}
              onChange={(e) => {
                dirty.current.children = true;
                setChildren(clampInt(e.target.value, 0, 0, 10));
              }}
              className="mt-2 w-full rounded-xl bg-white/10 border border-white/15 px-3 py-3 text-sm outline-none text-white"
              style={inputStyle}
            >
              {[0, 1, 2, 3, 4].map((n) => (
                <option key={n} value={n} className="bg-[#2f2f2f] text-white">
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-2 grid gap-2 text-sm">
          <div className="flex items-center justify-between text-white/70">
            <span className="uppercase tracking-[0.15em] text-[11px]">
              Nights
            </span>
            <span>{validDates ? nights : "—"}</span>
          </div>

          <div className="flex items-center justify-between text-white/70">
            <span className="uppercase tracking-[0.15em] text-[11px]">
              Price / night
            </span>
            <span>{money(props.pricePerNight ?? null, props.currency ?? "NGN")}</span>
          </div>

          <div className="flex items-center justify-between text-white/80 font-semibold">
            <span className="uppercase tracking-[0.15em] text-[11px]">
              Total
            </span>
            <span>{validDates ? money(total, props.currency ?? "NGN") : "—"}</span>
          </div>
        </div>

        {/* Step 1: Create booking */}
        <Button
          onClick={createBooking}
          disabled={busy || !canCreateBooking}
          className="!w-full !rounded-none !py-4 !bg-[var(--accent)] hover:!bg-[var(--accent-2)] disabled:opacity-60"
        >
          {busy ? "Creating…" : "Create Reservation"}
        </Button>

        {/* Receipt link once booking exists */}
        {bookingId && (
          <Button
            href={`/booking/${bookingId}`}
            className="!w-full !rounded-none !py-4 !bg-white/10 hover:!bg-white/15 !border !border-white/15"
          >
            View Reservation Slip
          </Button>
        )}

        {/* Step 2: Pay */}
        <div className="grid gap-2">
          <Button
            onClick={() => startPayment("paystack")}
            disabled={!bookingId || payBusy !== null}
            className="!w-full !rounded-none !py-4 !bg-[var(--primary)] hover:!bg-[var(--primary-2)] disabled:opacity-60"
          >
            {payBusy === "paystack" ? "Opening Paystack…" : "Pay with Paystack"}
          </Button>

          <Button
            onClick={() => startPayment("monnify")}
            disabled={!bookingId || payBusy !== null}
            className="!w-full !rounded-none !py-4 !bg-white/10 hover:!bg-white/15 !border !border-white/15 disabled:opacity-60"
          >
            {payBusy === "monnify" ? "Opening Monnify…" : "Pay with Monnify"}
          </Button>

          <Button
            onClick={setPayAtHotel}
            disabled={!bookingId || payBusy !== null}
            className="!w-full !rounded-none !py-4 !bg-white/10 hover:!bg-white/15 !border !border-white/15 disabled:opacity-60"
          >
            {payBusy === "hotel" ? "Saving…" : "Pay at Hotel (hold 24h)"}
          </Button>
        </div>

        <div className="text-[11px] text-white/55 leading-relaxed">
          Flow: Create reservation → pay online OR pay at hotel → show booking slip at reception.
        </div>
      </div>
    </aside>
  );
}