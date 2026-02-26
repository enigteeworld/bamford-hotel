// app/payment/return/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

type VerifyResp = {
  ok: boolean;
  bookingId?: string;
  status?: "paid" | "failed" | "pending";
  message?: string;
};

export default function PaymentReturnPage() {
  const sp = useSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [res, setRes] = useState<VerifyResp | null>(null);

  const provider = (sp.get("provider") || "").toLowerCase();
  const bookingId = sp.get("bookingId") || "";

  // Paystack returns `reference` (sometimes trxref too)
  const paystackRef = sp.get("reference") || sp.get("trxref") || "";

  // Monnify returns one of these (varies)
  const monnifyPaymentRef = sp.get("paymentReference") || "";
  const monnifyTxnRef = sp.get("transactionReference") || "";

  const ref = useMemo(() => {
    if (provider === "paystack") return paystackRef;
    if (provider === "monnify") return monnifyPaymentRef || monnifyTxnRef;
    return "";
  }, [provider, paystackRef, monnifyPaymentRef, monnifyTxnRef]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setRes(null);

      if (!provider || !bookingId || !ref) {
        setRes({
          ok: false,
          status: "failed",
          bookingId,
          message: "Missing payment params in callback URL.",
        });
        setLoading(false);
        return;
      }

      try {
        const q = new URLSearchParams({ provider, bookingId, reference: ref });
        const r = await fetch(`/api/payments/verify?${q.toString()}`, { method: "GET" });
        const j = (await r.json()) as VerifyResp;

        setRes(j);

        // ✅ Redirect to receipt if paid
        if (j?.ok && j?.status === "paid" && j?.bookingId) {
          router.replace(`/booking/${j.bookingId}`);
        }
      } catch (e: any) {
        setRes({ ok: false, status: "failed", bookingId, message: e?.message || "Network error" });
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="lux-container py-14 md:py-20">
      <div className="max-w-xl lux-border lux-card rounded-3xl p-8 bg-white">
        <div className="lux-kicker">Payment</div>
        <h1 className="mt-3 text-2xl font-semibold">Payment status</h1>

        {loading ? (
          <p className="mt-4 text-sm lux-muted">Verifying payment…</p>
        ) : (
          <>
            <div className="mt-5 text-sm">
              {res?.ok && res?.status === "paid" ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
                  Payment successful ✅ Redirecting to your reservation slip…
                </div>
              ) : (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-900">
                  Payment not confirmed ❌ {res?.message ? `(${res.message})` : ""}
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3 flex-wrap">
              <Button href="/rooms" className="!bg-[var(--primary)] !text-white hover:!bg-[var(--primary-2)]">
                Back to Rooms
              </Button>

              {bookingId ? (
                <Button
                  href={`/booking/${bookingId}`}
                  className="!bg-white !border !border-[var(--line)] hover:!bg-black/[0.02]"
                >
                  View Reservation Slip
                </Button>
              ) : null}
            </div>
          </>
        )}
      </div>
    </main>
  );
}