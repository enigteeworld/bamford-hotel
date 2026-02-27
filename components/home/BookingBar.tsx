"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toISODate } from "@/lib/booking";

export default function BookingBar({ ctaText = "Book Now" }: { ctaText?: string }) {
  const router = useRouter();
  const today = useMemo(() => new Date(), []);
  const tomorrow = useMemo(() => new Date(Date.now() + 24 * 60 * 60 * 1000), []);

  const [checkIn, setCheckIn] = useState(toISODate(today));
  const [checkOut, setCheckOut] = useState(toISODate(tomorrow));
  const [rooms, setRooms] = useState(1);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const q = new URLSearchParams({
      check_in: checkIn,
      check_out: checkOut,
      rooms: String(rooms),
      adults: String(adults),
      children: String(children),
    });

    router.push(`/rooms?${q.toString()}`);
  }

  // ✅ Shared “premium” control style (fixes iOS date rounding too)
  const control =
    "mt-2 w-full rounded-xl border border-white/35 bg-white/60 px-3 py-2 text-sm " +
    "shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] " +
    "outline-none focus:ring-2 focus:ring-[rgba(15,90,87,0.18)] focus:border-white/60 " +
    "appearance-none [-webkit-appearance:none] overflow-hidden backdrop-blur-md";

  return (
    <form
      onSubmit={onSubmit}
      className={[
        // glass card
        "rounded-3xl p-4 md:p-5",
        "border border-white/30",
        "bg-white/18",
        "backdrop-blur-xl",
        "shadow-[0_18px_60px_rgba(0,0,0,0.18)]",
        "relative overflow-hidden",
      ].join(" ")}
    >
      {/* subtle glass highlight */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/35 via-white/12 to-white/0" />
      {/* hairline sheen */}
      <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/25 rounded-3xl" />

      <div className="relative grid gap-3 md:grid-cols-[1fr_1fr_120px_140px_140px_160px] items-end">
        <div>
          <div className="text-[11px] tracking-[0.25em] uppercase text-white/75">Check-in</div>
          <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className={control} />
        </div>

        <div>
          <div className="text-[11px] tracking-[0.25em] uppercase text-white/75">Check-out</div>
          <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className={control} />
        </div>

        <div>
          <div className="text-[11px] tracking-[0.25em] uppercase text-white/75">Rooms</div>
          <select value={rooms} onChange={(e) => setRooms(Number(e.target.value))} className={control}>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="text-[11px] tracking-[0.25em] uppercase text-white/75">Adults</div>
          <select value={adults} onChange={(e) => setAdults(Number(e.target.value))} className={control}>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="text-[11px] tracking-[0.25em] uppercase text-white/75">Children</div>
          <select value={children} onChange={(e) => setChildren(Number(e.target.value))} className={control}>
            {[0, 1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className={[
            "rounded-xl px-5 py-3 text-xs font-semibold uppercase tracking-[0.25em]",
            "bg-[var(--accent)] text-white hover:bg-[var(--accent-2)]",
            "shadow-[0_18px_50px_rgba(0,0,0,0.20)]",
            "border border-white/15",
          ].join(" ")}
        >
          {ctaText}
        </button>
      </div>

      <div className="relative mt-3 text-[11px] text-white/70">
        Reserve first, then pay online to confirm your booking.
      </div>

      {/* iOS/Safari: keep date input inner UI consistent with rounding */}
      <style>{`
        input[type="date"]::-webkit-datetime-edit { padding: 0; }
        input[type="date"]::-webkit-calendar-picker-indicator { opacity: 0.85; }
      `}</style>
    </form>
  );
}