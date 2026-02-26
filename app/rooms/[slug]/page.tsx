import { supabasePublic } from "@/lib/supabasePublic";
import { Button } from "@/components/ui/Button";
import RoomGallery from "@/components/rooms/RoomGallery";
import ReservationPanel from "@/components/rooms/ReservationPanel";
import { unstable_noStore as noStore } from "next/cache";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

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

function firstStr(v: any): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && typeof v[0] === "string") return v[0];
  return undefined;
}

function pickParam(sp: Record<string, any>, camel: string, snake: string) {
  return firstStr(sp?.[camel]) || firstStr(sp?.[snake]);
}

export default async function RoomDetailsPage(props: {
  params: { slug?: string } | Promise<{ slug?: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  noStore();

  const p = await Promise.resolve(props.params);
  const slug = (p?.slug ?? "").toString().trim();

  const sp = props.searchParams ? await props.searchParams : {};

  if (!slug) {
    return (
      <main className="lux-container py-16">
        <div className="lux-border lux-card rounded-3xl p-8 bg-white">
          <h1 className="text-xl font-semibold">Route param missing</h1>
          <p className="mt-2 text-sm lux-muted">
            This page did not receive <b>slug</b>.
            <br />
            Confirm this file path is: <b>app/rooms/[slug]/page.tsx</b>
          </p>
          <div className="mt-6">
            <Button href="/rooms">Back to Rooms</Button>
          </div>
        </div>
      </main>
    );
  }

  const supabase = supabasePublic();

  const { data: room, error } = await supabase
    .from("rooms")
    .select("id,slug,name,description,price_per_night,currency,bed_type,max_guests,size_sqm,amenities")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    return (
      <main className="lux-container py-16">
        <div className="lux-border lux-card rounded-3xl p-8 bg-white">
          <h1 className="text-xl font-semibold">Could not load room</h1>
          <p className="mt-2 text-sm lux-muted">Supabase error:</p>
          <pre className="mt-4 whitespace-pre-wrap text-xs bg-black/5 p-4 rounded-2xl">{error.message}</pre>
          <div className="mt-6">
            <Button href="/rooms">Back to Rooms</Button>
          </div>
        </div>
      </main>
    );
  }

  if (!room) {
    return (
      <main className="lux-container py-16">
        <div className="lux-border lux-card rounded-3xl p-8 bg-white">
          <h1 className="text-xl font-semibold">Room not found</h1>
          <p className="mt-2 text-sm lux-muted">
            No room exists with slug: <b>{slug}</b>
          </p>
          <div className="mt-6">
            <Button href="/rooms">Back to Rooms</Button>
          </div>
        </div>
      </main>
    );
  }

  const { data: imgs, error: imgsErr } = await supabase
    .from("room_images")
    .select("url,sort_order")
    .eq("room_id", room.id)
    .order("sort_order", { ascending: true });

  const gallery = (imgs || []).map((x: any) => x.url).filter(Boolean);

  const amen = Array.isArray(room.amenities) ? room.amenities : [];
  const extras = amen.slice(0, 6);

  // ✅ Carry search params into reservation defaults (supports camel + snake)
  const initial = {
    checkIn: pickParam(sp, "checkIn", "check_in"),
    checkOut: pickParam(sp, "checkOut", "check_out"),
    rooms: pickParam(sp, "rooms", "rooms"),
    adults: pickParam(sp, "adults", "adults"),
    children: pickParam(sp, "children", "children"),
  };

  return (
    <main className="lux-container py-10 md:py-14">
      <div className="grid gap-8 lg:grid-cols-[1fr_380px] items-start">
        <div className="grid gap-8">
          {imgsErr ? (
            <div className="lux-border lux-card rounded-3xl bg-white p-6">
              <div className="text-sm font-semibold">Gallery</div>
              <div className="mt-2 text-sm lux-muted">Could not load room images yet.</div>
              <pre className="mt-3 whitespace-pre-wrap text-xs bg-black/5 p-4 rounded-2xl">{imgsErr.message}</pre>
            </div>
          ) : (
            <RoomGallery images={gallery} title={room.name} />
          )}

          <div className="lux-border considered-lux-card rounded-3xl bg-white overflow-hidden">
            <div className="p-8 border-b border-[var(--line)]">
              <div className="lux-kicker text-[var(--accent)]">Room Details</div>
              <h1 className="mt-3 text-3xl font-semibold">{room.name}</h1>
              <p className="mt-3 text-sm lux-muted leading-relaxed">{room.description}</p>

              <div className="mt-6 flex flex-wrap gap-2 text-sm">
                <span className="px-3 py-1 rounded-full border border-[var(--line)] bg-black/[0.02]">
                  {money(room.price_per_night ?? null, room.currency ?? "NGN")} / night
                </span>
                {room.bed_type && (
                  <span className="px-3 py-1 rounded-full border border-[var(--line)] bg-black/[0.02]">
                    {room.bed_type}
                  </span>
                )}
                {room.max_guests && (
                  <span className="px-3 py-1 rounded-full border border-[var(--line)] bg-black/[0.02]">
                    Up to {room.max_guests} guests
                  </span>
                )}
                {room.size_sqm && (
                  <span className="px-3 py-1 rounded-full border border-[var(--line)] bg-black/[0.02]">
                    {room.size_sqm} m²
                  </span>
                )}
              </div>
            </div>

            <div className="p-8">
              <div className="text-sm font-semibold">Amenities</div>
              <div className="mt-4 flex flex-wrap gap-2">
                {amen.length ? (
                  amen.map((a: string) => (
                    <span key={a} className="px-3 py-1 rounded-full border border-[var(--line)] bg-white text-xs">
                      {a}
                    </span>
                  ))
                ) : (
                  <div className="text-sm lux-muted">No amenities yet.</div>
                )}
              </div>
            </div>
          </div>
        </div>

        <ReservationPanel
          roomId={room.id}
          pricePerNight={room.price_per_night ?? null}
          currency={room.currency ?? "NGN"}
          maxGuests={room.max_guests ?? null}
          extras={extras}
          initial={initial}
        />
      </div>
    </main>
  );
}