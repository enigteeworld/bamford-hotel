"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function BookingConfirmPage() {
  const sp = useSearchParams();
  const reference = sp.get("reference") || "";
  const [state, setState] = useState<{ status: "loading" | "ok" | "err"; msg: string }>({
    status: "loading",
    msg: "Verifying payment…",
  });

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!reference) {
        setState({ status: "err", msg: "Missing reference in URL." });
        return;
      }

      try {
        const res = await fetch(`/api/paystack/verify?reference=${encodeURIComponent(reference)}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Verification failed");

        const payStatus = json?.data?.status;
        if (!cancelled) {
          if (payStatus === "success") setState({ status: "ok", msg: "Payment successful ✅" });
          else setState({ status: "err", msg: `Payment not successful: ${payStatus}` });
        }
      } catch (e: any) {
        if (!cancelled) setState({ status: "err", msg: e?.message || "Verification error" });
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [reference]);

  return (
    <main className="lux-container py-16">
      <div className="lux-border lux-card rounded-3xl p-8 bg-white max-w-2xl">
        <div className="lux-kicker">Booking</div>
        <h1 className="mt-3 text-2xl font-semibold">Payment Confirmation</h1>

        <div className="mt-6">
          {state.status === "loading" && <div className="text-sm lux-muted">{state.msg}</div>}
          {state.status === "ok" && <div className="text-sm text-emerald-700">{state.msg}</div>}
          {state.status === "err" && <div className="text-sm text-red-700">{state.msg}</div>}
        </div>

        <div className="mt-8 flex gap-3">
          <Button href="/rooms" className="!bg-[var(--primary)] !text-white hover:!bg-[var(--primary-2)]">
            Back to Rooms
          </Button>
          <Button href="/" variant="ghost">
            Home
          </Button>
        </div>

        {!!reference && (
          <div className="mt-6 text-xs lux-muted">
            Reference: <span className="font-mono">{reference}</span>
          </div>
        )}
      </div>
    </main>
  );
}

