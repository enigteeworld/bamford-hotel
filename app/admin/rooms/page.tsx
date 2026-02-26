"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Room = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price_per_night: number | null;
  currency: string | null;
  bed_type: string | null;
  max_guests: number | null;
  size_sqm: number | null;
  amenities: string[] | null;
  created_at?: string;
};

type RoomImage = {
  id: string;
  room_id: string;
  url: string;
  sort_order: number | null;
  created_at?: string;
};

function cls(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

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

export default function AdminRoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [images, setImages] = useState<Record<string, RoomImage[]>>({});
  const [loading, setLoading] = useState(true);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [banner, setBanner] = useState<{ type: "ok" | "err" | "info"; text: string } | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  // Create / edit draft
  const [draft, setDraft] = useState<Partial<Room>>({});
  const [amenityInput, setAmenityInput] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedRoom = useMemo(
    () => rooms.find((r) => r.id === selectedId) || null,
    [rooms, selectedId]
  );

  // ---------- Load ----------
  async function load() {
    setLoading(true);
    setBanner({ type: "info", text: "Loading rooms…" });

    const { data: roomData, error: roomErr } = await supabase
      .from("rooms")
      .select("id,slug,name,description,price_per_night,currency,bed_type,max_guests,size_sqm,amenities,created_at")
      .order("created_at", { ascending: false });

    if (roomErr) {
      setBanner({ type: "err", text: roomErr.message });
      setRooms([]);
      setImages({});
      setLoading(false);
      return;
    }

    const list = (roomData || []) as Room[];
    setRooms(list);

    // Load images for all rooms (single query)
    const ids = list.map((r) => r.id);
    if (ids.length) {
      const { data: imgData, error: imgErr } = await supabase
        .from("room_images")
        .select("id,room_id,url,sort_order,created_at")
        .in("room_id", ids)
        .order("sort_order", { ascending: true });

      if (imgErr) {
        setBanner({ type: "err", text: `Rooms loaded, but images failed: ${imgErr.message}` });
      } else {
        const by: Record<string, RoomImage[]> = {};
        (imgData || []).forEach((img: any) => {
          const r = img.room_id as string;
          by[r] = by[r] || [];
          by[r].push(img as RoomImage);
        });
        setImages(by);
        setBanner(null);
      }
    } else {
      setImages({});
      setBanner(null);
    }

    // keep selection
    setSelectedId((prev) => {
      if (prev && list.some((r) => r.id === prev)) return prev;
      return list[0]?.id || null;
    });

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  // ---------- Helpers ----------
  function startCreate() {
    setSelectedId(null);
    setDraft({
      slug: "",
      name: "",
      description: "",
      price_per_night: null,
      currency: "NGN",
      bed_type: "",
      max_guests: null,
      size_sqm: null,
      amenities: [],
    });
    setAmenityInput("");
    setBanner({ type: "info", text: "Creating a new room. Fill details then click Create." });
  }

  function startEdit(room: Room) {
    setSelectedId(room.id);
    setDraft({
      ...room,
      amenities: Array.isArray(room.amenities) ? room.amenities : [],
    });
    setAmenityInput("");
    setBanner(null);
  }

  function setField<K extends keyof Room>(key: K, value: Room[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function currentRoomImages(roomId: string) {
    return images[roomId] || [];
  }

  function nextSortOrder(roomId: string) {
    const arr = currentRoomImages(roomId);
    const max = arr.reduce((m, x) => Math.max(m, x.sort_order ?? 0), 0);
    return max + 1;
  }

  function validateRoomDraft(): { ok: true; payload: Partial<Room> } | { ok: false; error: string } {
    const name = (draft.name || "").toString().trim();
    let slug = (draft.slug || "").toString().trim();

    if (!name) return { ok: false, error: "Room name is required." };
    if (!slug) slug = slugify(name);

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      return {
        ok: false,
        error: "Slug must be lowercase letters/numbers with hyphens only (e.g. deluxe-king).",
      };
    }

    const payload: Partial<Room> = {
      slug,
      name,
      description: (draft.description || "").toString().trim() || null,
      price_per_night: draft.price_per_night ?? null,
      currency: (draft.currency || "NGN").toString().trim() || "NGN",
      bed_type: (draft.bed_type || "").toString().trim() || null,
      max_guests: draft.max_guests ?? null,
      size_sqm: draft.size_sqm ?? null,
      amenities: Array.isArray(draft.amenities) ? draft.amenities : [],
    };

    return { ok: true, payload };
  }

  // ---------- Create / Save / Delete (via API) ----------
  async function createRoom() {
    const v = validateRoomDraft();
    if (!v.ok) return setBanner({ type: "err", text: v.error });

    setBusyKey("create");
    setBanner({ type: "info", text: "Creating room…" });

    const res = await apiJson<Room>("/api/admin/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(v.payload),
    });

    if (!res.ok) {
      setBusyKey(null);
      return setBanner({ type: "err", text: res.error });
    }

    setBanner({ type: "ok", text: "Room created." });
    setBusyKey(null);

    // reload from DB so UI reflects truth
    await load();

    // try select created room
    setSelectedId(res.data.id);
    setDraft({
      ...res.data,
      amenities: Array.isArray(res.data.amenities) ? res.data.amenities : [],
    });
  }

  async function saveRoom() {
    if (!selectedRoom) return;

    const v = validateRoomDraft();
    if (!v.ok) return setBanner({ type: "err", text: v.error });

    const roomId = selectedRoom.id;

    setBusyKey(`save:${roomId}`);
    setBanner({ type: "info", text: "Saving room…" });

    const res = await apiJson<Room>("/api/admin/rooms", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: roomId, ...v.payload }),
    });

    if (!res.ok) {
      setBusyKey(null);
      return setBanner({ type: "err", text: res.error });
    }

    setBanner({ type: "ok", text: "Room saved." });
    setBusyKey(null);

    // reload from DB to guarantee the public pages get the same data
    await load();

    // keep selection and draft in sync
    setSelectedId(res.data.id);
    setDraft({
      ...res.data,
      amenities: Array.isArray(res.data.amenities) ? res.data.amenities : [],
    });
  }

  async function deleteRoom() {
    if (!selectedRoom) return;
    const roomId = selectedRoom.id;

    const ok = confirm(`Delete "${selectedRoom.name}"?\n\nThis will also delete its images.`);
    if (!ok) return;

    setBusyKey(`del:${roomId}`);
    setBanner({ type: "info", text: "Deleting room…" });

    const res = await apiJson<{ ok: true }>(`/api/admin/rooms?id=${encodeURIComponent(roomId)}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      setBusyKey(null);
      return setBanner({ type: "err", text: res.error });
    }

    setBanner({ type: "ok", text: "Room deleted." });
    setBusyKey(null);

    setDraft({});
    setSelectedId(null);
    await load();
  }

  // ---------- Amenities ----------
  function addAmenity() {
    const v = amenityInput.trim();
    if (!v) return;
    const list = Array.isArray(draft.amenities) ? [...draft.amenities] : [];
    if (!list.includes(v)) list.push(v);
    setField("amenities", list as any);
    setAmenityInput("");
  }

  function removeAmenity(a: string) {
    const list = Array.isArray(draft.amenities) ? draft.amenities.filter((x) => x !== a) : [];
    setField("amenities", list as any);
  }

  // ---------- Image upload ----------
  async function uploadRoomImage(file: File) {
    if (!selectedRoom) return;
    const roomId = selectedRoom.id;

    setBusyKey(`imgup:${roomId}`);
    setBanner({ type: "info", text: "Uploading image…" });

    const path = `rooms/${roomId}/${Date.now()}-${safeFileName(file.name)}`;

    const { error: upErr } = await supabase.storage.from("site-media").upload(path, file, {
      upsert: true,
    });

    if (upErr) {
      setBusyKey(null);
      return setBanner({ type: "err", text: upErr.message });
    }

    const { data } = supabase.storage.from("site-media").getPublicUrl(path);
    const url = data.publicUrl;

    const order = nextSortOrder(roomId);

    // ✅ insert room_images row via API (avoids RLS silent failures)
    const res = await apiJson<RoomImage>("/api/admin/room-images", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room_id: roomId, url, sort_order: order }),
    });

    if (!res.ok) {
      setBusyKey(null);
      return setBanner({ type: "err", text: res.error });
    }

    setBanner({ type: "ok", text: "Image added." });
    setBusyKey(null);

    await load(); // reload to keep ordering consistent
  }

  async function deleteImage(img: RoomImage) {
    const ok = confirm("Delete this image?");
    if (!ok) return;

    setBusyKey(`imgdel:${img.id}`);
    setBanner({ type: "info", text: "Deleting image…" });

    const res = await apiJson<{ ok: true }>(`/api/admin/room-images?id=${encodeURIComponent(img.id)}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      setBusyKey(null);
      return setBanner({ type: "err", text: res.error });
    }

    setBanner({ type: "ok", text: "Image deleted." });
    setBusyKey(null);
    await load();
  }
async function moveImage(img: RoomImage, dir: -1 | 1) {
  const roomId = img.room_id;
  const arr = currentRoomImages(roomId);
  const idx = arr.findIndex((x) => x.id === img.id);
  const other = arr[idx + dir];
  if (!other) return;

  const a = img.sort_order ?? 0;
  const b = other.sort_order ?? 0;

  setBusyKey(`imgmove:${img.id}`);
  setBanner({ type: "info", text: "Reordering…" });

  // ✅ do NOT force { ok: true } here
  const r1 = await apiJson<any>("/api/admin/room-images", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: img.id, sort_order: b }),
  });

  const r2 = await apiJson<any>("/api/admin/room-images", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: other.id, sort_order: a }),
  });

  if (!r1.ok || !r2.ok) {
    setBusyKey(null);
    const errText =
      (!r1.ok ? r1.error : "") ||
      (!r2.ok ? r2.error : "") ||
      "Failed to reorder";
    return setBanner({ type: "err", text: errText });
  }

  setBanner({ type: "ok", text: "Reordered." });
  setBusyKey(null);
  await load();
}
  
  // ---------- UI ----------
  return (
    <main className="min-h-[calc(100vh-120px)] bg-[var(--bg)]">
      {/* Sticky header */}
      <div className="border-b border-[var(--line)] bg-white/95 backdrop-blur sticky top-0 z-50">
        <div className="lux-container py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.35em] text-black/55">Admin Panel</div>
            <div className="mt-1 text-2xl font-semibold">Rooms Manager</div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={startCreate}
              className="rounded-full bg-[var(--primary)] text-white px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em]
                         hover:bg-[var(--primary-2)] transition"
            >
              + New Room
            </button>

            <button
              onClick={load}
              disabled={busyKey !== null}
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

      <div className="lux-container py-7 md:py-10 grid gap-6 lg:grid-cols-[360px_1fr]">
        {/* Left list */}
        <aside className="lux-border lux-card rounded-3xl p-5 bg-white h-fit lg:sticky lg:top-[96px]">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Rooms</div>
            <div className="text-xs text-black/45">{rooms.length} total</div>
          </div>

          {loading ? (
            <div className="mt-4 text-sm lux-muted">Loading…</div>
          ) : rooms.length === 0 ? (
            <div className="mt-4 text-sm lux-muted">No rooms yet. Click “New Room”.</div>
          ) : (
            <div className="mt-4 grid gap-2">
              {rooms.map((r) => {
                const active = r.id === selectedId;
                const hero = (images[r.id] || [])[0]?.url || "";
                return (
                  <button
                    key={r.id}
                    onClick={() => startEdit(r)}
                    className={cls(
                      "w-full text-left rounded-2xl px-4 py-3 border transition",
                      active
                        ? "border-[var(--primary)] bg-[rgba(15,90,87,0.08)]"
                        : "border-transparent hover:border-[var(--line)] hover:bg-black/[0.02]"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/[0.04] flex-shrink-0">
                        {hero ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={hero} alt={r.name} className="w-full h-full object-cover" />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{r.name}</div>
                        <div className="text-xs text-black/45 break-all">{r.slug}</div>
                        <div className="mt-1 text-xs text-black/55">
                          {money(r.price_per_night, r.currency)} {r.price_per_night != null ? "/ night" : ""}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        {/* Right editor */}
        <section className="grid gap-6">
          <div className="lux-border lux-card rounded-3xl bg-white overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--line)] flex items-center justify-between">
              <div className="text-sm font-semibold">{selectedRoom ? "Edit Room" : "Create Room"}</div>
              {selectedRoom ? (
                <div className="text-xs text-black/45">
                  Live URL: <span className="font-semibold">/rooms/{selectedRoom.slug}</span>
                </div>
              ) : (
                <div className="text-xs text-black/45">Draft</div>
              )}
            </div>

            <div className="p-6 grid gap-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="text-xs font-semibold">Name</div>
                  <input
                    value={(draft.name || "") as any}
                    onChange={(e) => setField("name", e.target.value as any)}
                    placeholder="Deluxe King Room"
                    className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none"
                  />
                </div>

                <div>
                  <div className="text-xs font-semibold">Slug</div>
                  <input
                    value={(draft.slug || "") as any}
                    onChange={(e) => setField("slug", slugify(e.target.value) as any)}
                    placeholder="deluxe-king"
                    className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none"
                  />
                  <div className="mt-2 text-[11px] text-black/45">Lowercase + hyphens only. Used in your URL.</div>
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold">Description</div>
                <textarea
                  value={(draft.description || "") as any}
                  onChange={(e) => setField("description", e.target.value as any)}
                  placeholder="A refined king room designed for premium relaxation…"
                  className="mt-2 w-full min-h-[120px] rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <div className="text-xs font-semibold">Price / Night</div>
                  <input
                    type="number"
                    value={draft.price_per_night ?? ""}
                    onChange={(e) =>
                      setField("price_per_night", (e.target.value ? Number(e.target.value) : null) as any)
                    }
                    placeholder="95000"
                    className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none"
                  />
                </div>

                <div>
                  <div className="text-xs font-semibold">Currency</div>
                  <input
                    value={(draft.currency || "NGN") as any}
                    onChange={(e) => setField("currency", e.target.value as any)}
                    placeholder="NGN"
                    className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none"
                  />
                </div>

                <div>
                  <div className="text-xs font-semibold">Bed Type</div>
                  <input
                    value={(draft.bed_type || "") as any}
                    onChange={(e) => setField("bed_type", e.target.value as any)}
                    placeholder="King Bed"
                    className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none"
                  />
                </div>

                <div>
                  <div className="text-xs font-semibold">Max Guests</div>
                  <input
                    type="number"
                    value={draft.max_guests ?? ""}
                    onChange={(e) => setField("max_guests", (e.target.value ? Number(e.target.value) : null) as any)}
                    placeholder="2"
                    className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <div className="text-xs font-semibold">Size (m²)</div>
                  <input
                    type="number"
                    value={draft.size_sqm ?? ""}
                    onChange={(e) => setField("size_sqm", (e.target.value ? Number(e.target.value) : null) as any)}
                    placeholder="32"
                    className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <div className="text-xs font-semibold">Amenities</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(Array.isArray(draft.amenities) ? draft.amenities : []).map((a) => (
                      <button
                        key={a}
                        onClick={() => removeAmenity(a)}
                        className="px-3 py-1 rounded-full border border-[var(--line)] bg-black/[0.02] text-xs hover:bg-black/[0.04]"
                        title="Click to remove"
                        type="button"
                      >
                        {a} <span className="ml-1 text-black/40">×</span>
                      </button>
                    ))}
                  </div>

                  <div className="mt-3 flex gap-2">
                    <input
                      value={amenityInput}
                      onChange={(e) => setAmenityInput(e.target.value)}
                      placeholder="e.g. Free Wi-Fi"
                      className="flex-1 rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none"
                    />
                    <button
                      onClick={addAmenity}
                      type="button"
                      className="rounded-2xl bg-[var(--accent)] text-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.25em] hover:bg-[var(--accent-2)]"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* actions */}
              <div className="flex flex-wrap gap-2 pt-2">
                {!selectedRoom ? (
                  <button
                    onClick={createRoom}
                    disabled={busyKey === "create"}
                    className="rounded-full bg-[var(--primary)] text-white px-6 py-3 text-xs font-semibold uppercase tracking-[0.25em]
                               hover:bg-[var(--primary-2)] transition disabled:opacity-50"
                    type="button"
                  >
                    {busyKey === "create" ? "Creating…" : "Create Room"}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={saveRoom}
                      disabled={!!busyKey?.startsWith("save:")}
                      className="rounded-full bg-[var(--primary)] text-white px-6 py-3 text-xs font-semibold uppercase tracking-[0.25em]
                                 hover:bg-[var(--primary-2)] transition disabled:opacity-50"
                      type="button"
                    >
                      {busyKey === `save:${selectedRoom.id}` ? "Saving…" : "Save Changes"}
                    </button>

                    <button
                      onClick={deleteRoom}
                      disabled={!!busyKey?.startsWith("del:")}
                      className="rounded-full border border-red-200 bg-red-50 text-red-900 px-6 py-3 text-xs font-semibold uppercase tracking-[0.25em]
                                 hover:bg-red-100 transition disabled:opacity-50"
                      type="button"
                    >
                      {busyKey === `del:${selectedRoom.id}` ? "Deleting…" : "Delete Room"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Images manager */}
          <div className="lux-border lux-card rounded-3xl bg-white overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--line)] flex items-center justify-between">
              <div className="text-sm font-semibold">Room Images</div>
              <div className="text-xs text-black/45">First image is treated as the “hero” in listings</div>
            </div>

            {!selectedRoom ? (
              <div className="p-6 text-sm lux-muted">Create/select a room first to manage images.</div>
            ) : (
              <div className="p-6 grid gap-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadRoomImage(f);
                    e.currentTarget.value = "";
                  }}
                />

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!!busyKey?.startsWith("imgup:")}
                    className="rounded-full bg-[var(--accent)] text-white px-6 py-3 text-xs font-semibold uppercase tracking-[0.25em]
                               hover:bg-[var(--accent-2)] transition disabled:opacity-50"
                    type="button"
                  >
                    {busyKey === `imgup:${selectedRoom.id}` ? "Uploading…" : "Upload Image"}
                  </button>
                  <span className="text-xs text-black/45">JPG / PNG / WebP</span>
                </div>

                {currentRoomImages(selectedRoom.id).length === 0 ? (
                  <div className="text-sm lux-muted">No images yet.</div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {currentRoomImages(selectedRoom.id).map((img, idx) => (
                      <div key={img.id} className="lux-border rounded-2xl overflow-hidden">
                        <div className="h-[200px] bg-black/[0.04]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img.url} alt="" className="w-full h-full object-cover" />
                        </div>

                        <div className="p-4 flex items-center justify-between gap-2">
                          <div className="text-xs text-black/45">
                            #{idx + 1} · order {img.sort_order ?? 0}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => moveImage(img, -1)}
                              disabled={idx === 0 || !!busyKey?.startsWith("imgmove:")}
                              className="rounded-full border border-[var(--line)] bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.25em]
                                         hover:bg-black/[0.03] disabled:opacity-50"
                              type="button"
                            >
                              ↑
                            </button>
                            <button
                              onClick={() => moveImage(img, 1)}
                              disabled={
                                idx === currentRoomImages(selectedRoom.id).length - 1 ||
                                !!busyKey?.startsWith("imgmove:")
                              }
                              className="rounded-full border border-[var(--line)] bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.25em]
                                         hover:bg-black/[0.03] disabled:opacity-50"
                              type="button"
                            >
                              ↓
                            </button>
                            <button
                              onClick={() => deleteImage(img)}
                              disabled={busyKey === `imgdel:${img.id}`}
                              className="rounded-full border border-red-200 bg-red-50 text-red-900 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.25em]
                                         hover:bg-red-100 disabled:opacity-50"
                              type="button"
                            >
                              {busyKey === `imgdel:${img.id}` ? "…" : "Delete"}
                            </button>
                          </div>
                        </div>

                        <div className="px-4 pb-4 text-[11px] text-black/45 break-all">{img.url}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="text-xs text-black/45">
            Next: we’ll add a “Bookings / Payments” flow so “Check Reservation” can calculate price and route to payment.
          </div>
        </section>
      </div>
    </main>
  );
}
