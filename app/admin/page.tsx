"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type ContentRow = {
  key: string;
  type: "text" | "image";
  value: string;
  label: string;
  group: string;
};

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function cls(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

function prettyGroup(g: string) {
  if (!g) return "General";
  return g.charAt(0).toUpperCase() + g.slice(1);
}

function iconForGroup(g: string) {
  const k = (g || "").toLowerCase();
  if (k.includes("home")) return "🏠";
  if (k.includes("site")) return "🏷️";
  if (k.includes("rooms")) return "🛏️";
  if (k.includes("about")) return "ℹ️";
  if (k.includes("contact")) return "☎️";
  if (k.includes("gallery")) return "🖼️";
  return "⚙️";
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[var(--line)] bg-white px-3 py-1 text-[11px] font-semibold text-black/70">
      {children}
    </span>
  );
}

export default function AdminPage() {
  const [rows, setRows] = useState<ContentRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeGroup, setActiveGroup] = useState<string>("site");
  const [query, setQuery] = useState("");

  const [draft, setDraft] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const [banner, setBanner] = useState<{ type: "ok" | "err" | "info"; text: string } | null>(null);

  const dirtyCount = useMemo(() => Object.keys(draft).length, [draft]);

  async function load() {
    setLoading(true);
    setBanner({ type: "info", text: "Loading content…" });

    const { data, error } = await supabase
      .from("site_content")
      .select("key,type,value,label,group")
      .order("group", { ascending: true })
      .order("key", { ascending: true });

    if (error) {
      setRows([]);
      setBanner({ type: "err", text: error.message });
      setLoading(false);
      return;
    }

    const list = (data || []) as ContentRow[];
    setRows(list);

    const set = new Set(list.map((r) => r.group || "general"));
    if (!set.has(activeGroup)) {
      setActiveGroup(set.has("site") ? "site" : list[0]?.group || "general");
    }

    setBanner(null);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const groups = useMemo(() => {
    const gs = Array.from(new Set(rows.map((r) => r.group || "general")));
    gs.sort((a, b) => a.localeCompare(b));
    const priority = ["site", "home", "rooms", "about", "contact", "gallery"];
    gs.sort((a, b) => {
      const ai = priority.indexOf(a);
      const bi = priority.indexOf(b);
      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
    return gs;
  }, [rows]);

  function getValue(row: ContentRow) {
    return draft[row.key] ?? row.value ?? "";
  }

  function setValue(key: string, value: string) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function discardKey(key: string) {
    setDraft((prev) => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  }

  async function saveKey(key: string) {
    const next = draft[key];
    if (next === undefined) return;

    setSavingKey(key);
    setBanner({ type: "info", text: "Saving…" });

    const { error } = await supabase.from("site_content").update({ value: next }).eq("key", key);

    if (error) {
      setBanner({ type: "err", text: error.message });
      setSavingKey(null);
      return;
    }

    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, value: next } : r)));
    discardKey(key);

    setBanner({ type: "ok", text: "Saved." });
    setSavingKey(null);
  }

  async function saveAll() {
    const keys = Object.keys(draft);
    if (!keys.length) return;

    setSavingKey("__all__");
    setBanner({ type: "info", text: `Saving ${keys.length} change(s)…` });

    for (const key of keys) {
      const val = draft[key];
      const { error } = await supabase.from("site_content").update({ value: val }).eq("key", key);

      if (error) {
        setBanner({ type: "err", text: `Failed saving ${key}: ${error.message}` });
        setSavingKey(null);
        return;
      }

      setRows((prev) => prev.map((r) => (r.key === key ? { ...r, value: val } : r)));
    }

    setDraft({});
    setBanner({ type: "ok", text: "All changes saved." });
    setSavingKey(null);
  }

  async function uploadImage(key: string, file: File) {
    setSavingKey(key);
    setBanner({ type: "info", text: "Uploading image…" });

    const path = `site/${key}/${Date.now()}-${safeFileName(file.name)}`;

    const { error: upErr } = await supabase.storage.from("site-media").upload(path, file, { upsert: true });

    if (upErr) {
      setBanner({ type: "err", text: upErr.message });
      setSavingKey(null);
      return;
    }

    const { data } = supabase.storage.from("site-media").getPublicUrl(path);
    const url = data.publicUrl;

    const { error } = await supabase.from("site_content").update({ value: url }).eq("key", key);

    if (error) {
      setBanner({ type: "err", text: error.message });
      setSavingKey(null);
      return;
    }

    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, value: url } : r)));
    setBanner({ type: "ok", text: "Image updated." });
    setSavingKey(null);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter((r) => (r.group || "general") === activeGroup)
      .filter((r) => {
        if (!q) return true;
        return r.key.toLowerCase().includes(q) || (r.label || "").toLowerCase().includes(q);
      });
  }, [rows, activeGroup, query]);

  const images = filtered.filter((r) => r.type === "image");
  const texts = filtered.filter((r) => r.type === "text");

  return (
    <main className="min-h-[calc(100vh-120px)] bg-[var(--bg)]">
      {/* Sticky Admin Header */}
      <div className="border-b border-[var(--line)] bg-white/95 backdrop-blur sticky top-0 z-50">
        <div className="lux-container py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.35em] text-black/55">Admin Panel</div>
            <div className="mt-1 text-2xl font-semibold">Website Content</div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge>{prettyGroup(activeGroup)}</Badge>
            <Badge>{rows.length} items</Badge>
            <Badge>{dirtyCount} unsaved</Badge>

            <button
              onClick={saveAll}
              disabled={savingKey !== null || dirtyCount === 0}
              className="ml-0 md:ml-2 rounded-full bg-[var(--primary)] text-white px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em]
                         hover:bg-[var(--primary-2)] transition disabled:opacity-50"
            >
              {savingKey === "__all__" ? "Saving…" : "Save All"}
            </button>

            <button
              onClick={load}
              disabled={savingKey !== null}
              className="rounded-full border border-[var(--line)] bg-white px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em]
                         hover:bg-black/[0.03] transition disabled:opacity-50"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Banner */}
      {banner && (
        <div className="lux-container mt-5">
          <div
            className={cls(
              "rounded-2xl border px-4 py-3 text-sm",
              banner.type === "ok" && "border-emerald-200 bg-emerald-50 text-emerald-900",
              banner.type === "err" && "border-red-200 bg-red-50 text-red-900",
              banner.type === "info" && "border-[var(--line)] bg-white text-black/70"
            )}
          >
            {banner.text}
          </div>
        </div>
      )}

      <div className="lux-container py-7 md:py-10 grid gap-6 md:grid-cols-[280px_1fr]">
        {/* Sidebar */}
        <aside className="lux-border lux-card rounded-3xl p-5 bg-white h-fit md:sticky md:top-[96px]">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Sections</div>
            <div className="text-xs text-black/45">{dirtyCount ? `${dirtyCount} pending` : "All saved"}</div>
          </div>

          <div className="mt-4 grid gap-2">
            {groups.map((g) => {
              const active = g === activeGroup;
              return (
                <button
                  key={g}
                  onClick={() => setActiveGroup(g)}
                  className={cls(
                    "w-full text-left rounded-2xl px-4 py-3 border transition",
                    active
                      ? "border-[var(--primary)] bg-[rgba(15,90,87,0.08)]"
                      : "border-transparent hover:border-[var(--line)] hover:bg-black/[0.02]"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{iconForGroup(g)}</span>
                      <span className="font-medium">{prettyGroup(g)}</span>
                    </div>
                    {active && <span className="text-[10px] uppercase tracking-[0.35em] text-[var(--primary)]">Active</span>}
                  </div>
                  <div className="mt-1 text-xs text-black/45">
                    {rows.filter((r) => (r.group || "general") === g).length} items
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-6">
            <div className="lux-kicker">Search</div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search key or label…"
              className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none"
            />
          </div>

          <div className="mt-6 lux-border rounded-2xl p-4 bg-black/[0.02]">
            <div className="text-xs font-semibold">Company-ready tips</div>
            <ul className="mt-2 text-xs text-black/55 grid gap-1">
              <li>• Logo + favicon are in “Site”</li>
              <li>• Homepage sections are in “Home”</li>
              <li>• Images upload to Supabase Storage</li>
              <li>• Use “Save All” before leaving</li>
            </ul>
          </div>
        </aside>

        {/* Content */}
        <section className="grid gap-6">
          {/* Overview cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="lux-border lux-card rounded-3xl p-6 bg-white">
              <div className="lux-kicker">Section</div>
              <div className="mt-2 text-xl font-semibold">{prettyGroup(activeGroup)}</div>
              <div className="mt-2 text-sm lux-muted">Edit texts & images used across this section.</div>
            </div>

            <div className="lux-border lux-card rounded-3xl p-6 bg-white">
              <div className="lux-kicker">Images</div>
              <div className="mt-2 text-xl font-semibold">{images.length}</div>
              <div className="mt-2 text-sm lux-muted">Upload and replace media instantly.</div>
            </div>

            <div className="lux-border lux-card rounded-3xl p-6 bg-white">
              <div className="lux-kicker">Text fields</div>
              <div className="mt-2 text-xl font-semibold">{texts.length}</div>
              <div className="mt-2 text-sm lux-muted">Headings, copy, labels, buttons.</div>
            </div>
          </div>

          {/* Images */}
          <div className="lux-border lux-card rounded-3xl bg-white overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--line)] flex items-center justify-between">
              <div className="text-sm font-semibold">Images</div>
              <div className="text-xs text-black/45">Upload → updates site instantly</div>
            </div>

            {loading ? (
              <div className="p-6 text-sm lux-muted">Loading…</div>
            ) : images.length === 0 ? (
              <div className="p-6 text-sm lux-muted">No image fields in this section.</div>
            ) : (
              <div className="p-6 grid gap-5 md:grid-cols-2">
                {images.map((row) => {
                  const v = getValue(row);
                  const isBusy = savingKey === row.key;

                  return (
                    <div key={row.key} className="lux-border rounded-2xl overflow-hidden bg-white">
                      <div className="p-4 border-b border-[var(--line)] bg-black/[0.02]">
                        <div className="text-sm font-semibold">{row.label || row.key}</div>
                        <div className="mt-1 text-xs text-black/45 break-all">{row.key}</div>
                      </div>

                      {/* FIXED LAYOUT: always fits, mobile-friendly */}
                      <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr]">
                        {/* Preview */}
                        <div className="h-[190px] sm:h-[180px] bg-black/[0.04]">
                          {v ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={v} alt={row.label || row.key} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-black/45">
                              No image yet
                            </div>
                          )}
                        </div>

                        {/* Controls */}
                        <div className="p-4 min-w-0">
                          <div className="text-xs text-black/60">Upload replacement</div>

                          <div className="mt-3">
                            <label
                              className={cls(
                                "block w-full rounded-xl px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.25em] transition cursor-pointer text-center",
                                savingKey !== null
                                  ? "bg-black/10 text-black/40 cursor-not-allowed"
                                  : "bg-[var(--accent)] text-white hover:bg-[var(--accent-2)]"
                              )}
                            >
                              {isBusy ? "Uploading…" : "Upload Image"}
                              <input
                                type="file"
                                accept="image/*"
                                disabled={savingKey !== null}
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f) uploadImage(row.key, f);
                                  e.currentTarget.value = "";
                                }}
                                className="hidden"
                              />
                            </label>

                            <div className="mt-2 text-[11px] text-black/45">JPG/PNG/WebP</div>
                          </div>

                          <div className="mt-3 text-xs text-black/45 break-all">
                            Current URL: <span className="select-all">{v || "—"}</span>
                          </div>

                          <div className="mt-4">
                            <button
                              onClick={() => {}}
                              disabled={true}
                              className="w-full sm:w-auto rounded-full border border-[var(--line)] bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] opacity-60 cursor-not-allowed"
                              title="Images save automatically after upload"
                            >
                              Auto-saved
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Text editor */}
          <div className="lux-border lux-card rounded-3xl bg-white overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--line)] flex items-center justify-between">
              <div className="text-sm font-semibold">Text Content</div>
              <div className="text-xs text-black/45">Edit → Save or Save All</div>
            </div>

            {loading ? (
              <div className="p-6 text-sm lux-muted">Loading…</div>
            ) : texts.length === 0 ? (
              <div className="p-6 text-sm lux-muted">No text fields in this section.</div>
            ) : (
              <div className="divide-y divide-[var(--line)]">
                {texts.map((row) => {
                  const v = getValue(row);
                  const isDirty = draft[row.key] !== undefined && draft[row.key] !== row.value;
                  const busy = savingKey === row.key || savingKey === "__all__";

                  const isShort = (row.value || "").length <= 120;

                  return (
                    <div key={row.key} className="p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold">{row.label || row.key}</div>
                          <div className="mt-1 text-xs text-black/45 break-all">{row.key}</div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {isDirty ? (
                            <span className="text-[10px] uppercase tracking-[0.35em] text-[var(--accent)]">Unsaved</span>
                          ) : (
                            <span className="text-[10px] uppercase tracking-[0.35em] text-black/35">Saved</span>
                          )}

                          <button
                            onClick={() => discardKey(row.key)}
                            disabled={!isDirty || busy}
                            className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em]
                                       hover:bg-black/[0.03] transition disabled:opacity-50"
                          >
                            Discard
                          </button>

                          <button
                            onClick={() => saveKey(row.key)}
                            disabled={!isDirty || busy}
                            className="rounded-full bg-[var(--accent)] text-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em]
                                       hover:bg-[var(--accent-2)] transition disabled:opacity-50"
                          >
                            {savingKey === row.key ? "Saving…" : "Save"}
                          </button>
                        </div>
                      </div>

                      {isShort ? (
                        <input
                          value={v}
                          onChange={(e) => setValue(row.key, e.target.value)}
                          className="mt-4 w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none"
                        />
                      ) : (
                        <textarea
                          value={v}
                          onChange={(e) => setValue(row.key, e.target.value)}
                          className="mt-4 w-full min-h-[120px] rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="text-xs text-black/45">
            Next: we’ll add Rooms manager + Contact messages in this dashboard.
          </div>
        </section>
      </div>
    </main>
  );
}
