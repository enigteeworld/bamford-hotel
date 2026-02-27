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

    // ✅ standardize to snake_case in the URL
    const q = new URLSearchParams({
      check_in: checkIn,
      check_out: checkOut,
      rooms: String(rooms),
      adults: String(adults),
      children: String(children),
    });

    router.push(`/rooms?${q.toString()}`);
  }

  return (
    <form onSubmit={onSubmit} className="lux-border bg-white rounded-2xl p-4 md:p-5 shadow-sm">
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_120px_140px_140px_160px] items-end">
        <div>
          <div className="text-[11px] tracking-[0.25em] uppercase text-black/50">Check-in</div>
          <input
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            className="mt-2 w-full rounded-xl border border-[var(--line)] px-3 py-2 text-sm"
          />
        </div>

        <div>
          <div className="text-[11px] tracking-[0.25em] uppercase text-black/50">Check-out</div>
          <input
            type="date"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className="mt-2 w-full rounded-xl border border-[var(--line)] px-3 py-2 text-sm"
          />
        </div>

        <div>
          <div className="text-[11px] tracking-[0.25em] uppercase text-black/50">Rooms</div>
          <select
            value={rooms}
            onChange={(e) => setRooms(Number(e.target.value))}
            className="mt-2 w-full rounded-xl border border-[var(--line)] px-3 py-2 text-sm"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="text-[11px] tracking-[0.25em] uppercase text-black/50">Adults</div>
          <select
            value={adults}
            onChange={(e) => setAdults(Number(e.target.value))}
            className="mt-2 w-full rounded-xl border border-[var(--line)] px-3 py-2 text-sm"
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="text-[11px] tracking-[0.25em] uppercase text-black/50">Children</div>
          <select
            value={children}
            onChange={(e) => setChildren(Number(e.target.value))}
            className="mt-2 w-full rounded-xl border border-[var(--line)] px-3 py-2 text-sm"
          >
            {[0, 1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="rounded-xl bg-[var(--accent)] text-white px-5 py-3 text-xs font-semibold uppercase tracking-[0.25em] hover:bg-[var(--accent-2)]"
        >
          {ctaText}
        </button>
      </div>

      <div className="mt-3 text-[11px] text-black/50">
        Reserve first, then pay online to confirm your booking.
      </div>
    </form>
  );
}