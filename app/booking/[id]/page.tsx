// app/booking/[id]/page.tsx
import { supabasePublic } from "@/lib/supabasePublic";
import { Button } from "@/components/ui/Button";
import PrintButton from "@/components/booking/PrintButton";

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

export default async function BookingSlipPage(props: {
  params: { id?: string } | Promise<{ id?: string }>;
}) {
  const p = await Promise.resolve(props.params);
  const id = (p?.id || "").toString().trim();

  if (!id) {
    return (
      <main className="lux-container py-16">
        <div className="lux-border lux-card rounded-3xl p-8 bg-white">
          <h1 className="text-xl font-semibold">Missing booking id</h1>
          <div className="mt-6">
            <Button href="/rooms">Back to Rooms</Button>
          </div>
        </div>
      </main>
    );
  }

  const sb = supabasePublic();

  const { data: booking, error } = await sb
    .from("bookings")
    .select(
      "id, room_id, check_in, check_out, rooms, adults, children, guests, full_name, email, amount_kobo, currency, payment_status, paid_at"
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return (
      <main className="lux-container py-16">
        <div className="lux-border lux-card rounded-3xl p-8 bg-white">
          <h1 className="text-xl font-semibold">Could not load booking</h1>
          <pre className="mt-4 whitespace-pre-wrap text-xs bg-black/5 p-4 rounded-2xl">{error.message}</pre>
          <div className="mt-6">
            <Button href="/rooms">Back to Rooms</Button>
          </div>
        </div>
      </main>
    );
  }

  if (!booking) {
    return (
      <main className="lux-container py-16">
        <div className="lux-border lux-card rounded-3xl p-8 bg-white">
          <h1 className="text-xl font-semibold">Booking not found</h1>
          <p className="mt-2 text-sm lux-muted">No booking exists with that ID.</p>
          <div className="mt-6">
            <Button href="/rooms">Back to Rooms</Button>
          </div>
        </div>
      </main>
    );
  }

  const status = String(booking.payment_status || "unpaid").toLowerCase();

  return (
    <main className="lux-container py-14 md:py-20">
      <div className="max-w-2xl lux-border lux-card rounded-3xl p-8 bg-white">
        <div className="lux-kicker">Reservation Slip</div>
        <h1 className="mt-3 text-2xl font-semibold">Your booking is recorded</h1>

        <div className="mt-6 rounded-2xl border border-[var(--line)] bg-black/[0.02] p-5">
          <div className="text-[11px] uppercase tracking-[0.25em] text-black/55">Booking ID</div>
          <div className="mt-2 text-lg font-semibold break-all">{booking.id}</div>
        </div>

        <div className="mt-6 grid gap-3 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-black/60">Guest</span>
            <span className="font-medium">{booking.full_name || "—"}</span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-black/60">Email</span>
            <span className="font-medium">{booking.email || "—"}</span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-black/60">Check-in</span>
            <span className="font-medium">{booking.check_in}</span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-black/60">Check-out</span>
            <span className="font-medium">{booking.check_out}</span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-black/60">Rooms</span>
            <span className="font-medium">{booking.rooms ?? 1}</span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-black/60">Guests</span>
            <span className="font-medium">
              {booking.adults ?? 0} adults, {booking.children ?? 0} children
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-black/60">Amount</span>
            <span className="font-semibold">{moneyKobo(booking.amount_kobo ?? null, booking.currency ?? "NGN")}</span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-black/60">Payment status</span>
            <span
              className={[
                "font-semibold",
                status === "paid" ? "text-emerald-700" : "",
                status !== "paid" ? "text-amber-700" : "",
              ].join(" ")}
            >
              {status.toUpperCase()}
            </span>
          </div>

          {booking.paid_at ? (
            <div className="flex items-center justify-between gap-4">
              <span className="text-black/60">Paid at</span>
              <span className="font-medium">{new Date(booking.paid_at).toLocaleString()}</span>
            </div>
          ) : null}
        </div>

        <div className="mt-8 flex gap-3 flex-wrap">
          <Button href="/rooms" className="!bg-[var(--primary)] !text-white hover:!bg-[var(--primary-2)]">
            Back to Rooms
          </Button>

          {/* ✅ Client component handles window.print() */}
          <PrintButton />
        </div>

        <div className="mt-5 text-[12px] text-black/55 leading-relaxed">
          Tip: Keep this page (screenshot or print). Present the Booking ID at reception.
        </div>
      </div>
    </main>
  );
}