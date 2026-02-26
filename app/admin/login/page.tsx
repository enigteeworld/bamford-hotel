"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";

async function apiJson<T>(url: string, init?: RequestInit): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const res = await fetch(url, init);
    const text = await res.text();
    const json = text ? JSON.parse(text) : {};
    if (!res.ok) return { ok: false, error: json?.error || json?.message || `Request failed (${res.status})` };
    return { ok: true, data: json?.data ?? json };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Network error" };
  }
}

export default function AdminLoginPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const next = useMemo(() => sp.get("next") || "/admin", [sp]);

  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setErr(null);

    if (!username.trim() || !password.trim()) {
      setErr("Enter your username and password.");
      return;
    }

    setBusy(true);

    const res = await apiJson<{ ok: boolean }>("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username.trim(), password: password.trim() }),
    });

    setBusy(false);

    if (!res.ok) {
      setErr(res.error);
      return;
    }

    router.replace(next);
  }

  return (
    <main className="min-h-[calc(100vh-140px)] lux-container py-14 md:py-20">
      <div className="grid gap-8 lg:grid-cols-[1fr_420px] items-center">
        {/* Left: Brand panel */}
        <div className="hidden lg:block">
          <div className="lux-kicker">Admin</div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">Bamford Hotel Console</h1>
          <p className="mt-4 text-sm lux-muted leading-relaxed max-w-xl">
            Secure access to rooms, bookings, gallery and website content. Use your admin credentials to continue.
          </p>

          <div className="mt-10 lux-border rounded-3xl p-8 bg-white">
            <div className="text-sm font-semibold">Tips</div>
            <ul className="mt-3 text-sm lux-muted list-disc pl-5 space-y-2">
              <li>Keep your credentials private.</li>
              <li>Use a strong password in production.</li>
              <li>Logout after use on shared computers.</li>
            </ul>
          </div>
        </div>

        {/* Right: Login card */}
        <div className="lux-border lux-card rounded-3xl bg-white overflow-hidden">
          <div className="p-7 border-b border-[var(--line)]">
            <div className="lux-kicker">Sign in</div>
            <h2 className="mt-2 text-2xl font-semibold">Admin login</h2>
            <p className="mt-2 text-sm lux-muted">
              Enter your admin credentials to access the dashboard.
            </p>
          </div>

          <div className="p-7 grid gap-4">
            {err && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
                {err}
              </div>
            )}

            <div>
              <div className="text-[11px] uppercase tracking-[0.25em] lux-muted">Username</div>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="mt-2 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-3 text-sm outline-none"
              />
            </div>

            <div>
              <div className="text-[11px] uppercase tracking-[0.25em] lux-muted">Password</div>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                type="password"
                className="mt-2 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-3 text-sm outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter") submit();
                }}
              />
            </div>

            <Button
              onClick={submit}
              disabled={busy}
              className="!w-full !rounded-2xl !py-4 !bg-[var(--primary)] !text-white hover:!bg-[var(--primary-2)] disabled:opacity-60"
            >
              {busy ? "Signing in…" : "Sign in"}
            </Button>

            <div className="text-[11px] lux-muted leading-relaxed">
              Protected area. Unauthorized access is prohibited.
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}