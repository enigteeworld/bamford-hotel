"use client";

import { useState } from "react";

export default function ContactForm({
  labels,
}: {
  labels: { name: string; email: string; phone: string; subject: string; message: string; button: string };
}) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setNotice(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(data?.error || "Failed to send message");

      setNotice({ type: "ok", text: "Message sent successfully. We’ll reply shortly." });
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (err: any) {
      setNotice({ type: "err", text: err?.message || "Something went wrong" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="lux-border lux-card rounded-3xl bg-white p-8 md:p-10">
      {notice && (
        <div
          className={`mb-5 rounded-2xl border px-4 py-3 text-sm ${
            notice.type === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-900"
          }`}
        >
          {notice.text}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <div className="text-xs font-semibold text-black/60">{labels.name}</div>
          <input
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none"
            required
          />
        </div>

        <div>
          <div className="text-xs font-semibold text-black/60">{labels.email}</div>
          <input
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            type="email"
            className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none"
            required
          />
        </div>

        <div>
          <div className="text-xs font-semibold text-black/60">{labels.phone}</div>
          <input
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none"
          />
        </div>

        <div>
          <div className="text-xs font-semibold text-black/60">{labels.subject}</div>
          <input
            value={form.subject}
            onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
            className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none"
          />
        </div>

        <div className="md:col-span-2">
          <div className="text-xs font-semibold text-black/60">{labels.message}</div>
          <textarea
            value={form.message}
            onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
            className="mt-2 w-full min-h-[140px] rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none"
            required
          />
        </div>
      </div>

      <button
        disabled={loading}
        className="mt-6 rounded-full bg-[var(--primary)] text-white px-6 py-3 text-xs font-semibold uppercase tracking-[0.25em]
                   hover:bg-[var(--primary-2)] transition disabled:opacity-50"
        type="submit"
      >
        {loading ? "Sending…" : labels.button}
      </button>
    </form>
  );
}
