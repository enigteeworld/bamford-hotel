import { supabasePublic } from "@/lib/supabasePublic";
import { Button } from "@/components/ui/Button";

function Img({ src, alt }: { src?: string | null; alt: string }) {
  if (!src) {
    return (
      <div className="w-full h-full bg-black/[0.04] flex items-center justify-center text-xs lux-muted">
        No image
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className="w-full h-full object-cover" />;
}

type Room = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price_per_night: number | null;
};

type RoomImage = {
  room_id: string;
  url: string;
  sort_order: number | null;
};

function formatNGN(n?: number | null) {
  if (n === null || n === undefined) return "";
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `₦${n.toLocaleString()}`;
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

function buildQueryString(searchParams: Record<string, any>) {
  // We always emit snake_case so it matches your BookingBar screenshot URLs.
  const q = new URLSearchParams();

  const checkIn = pickParam(searchParams, "checkIn", "check_in");
  const checkOut = pickParam(searchParams, "checkOut", "check_out");
  const rooms = pickParam(searchParams, "rooms", "rooms");
  const adults = pickParam(searchParams, "adults", "adults");
  const children = pickParam(searchParams, "children", "children");

  if (checkIn?.trim()) q.set("check_in", checkIn.trim());
  if (checkOut?.trim()) q.set("check_out", checkOut.trim());
  if (rooms?.trim()) q.set("rooms", rooms.trim());
  if (adults?.trim()) q.set("adults", adults.trim());
  if (children?.trim()) q.set("children", children.trim());

  const s = q.toString();
  return s ? `?${s}` : "";
}

export default async function RoomsPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = supabasePublic();

  // ✅ Next 16: searchParams can be a Promise
  const sp = props.searchParams ? await props.searchParams : {};
  const qs = buildQueryString(sp || {});

  const { data: roomsData } = await supabase
    .from("rooms")
    .select("id,slug,name,description,price_per_night")
    .order("price_per_night", { ascending: true });

  const rooms = (roomsData || []) as Room[];

  const roomIds = rooms.map((r) => r.id);
  let imagesByRoom: Record<string, string> = {};

  if (roomIds.length) {
    const { data: imgData } = await supabase
      .from("room_images")
      .select("room_id,url,sort_order")
      .in("room_id", roomIds)
      .order("sort_order", { ascending: true });

    const imgs = (imgData || []) as RoomImage[];
    for (const im of imgs) {
      if (!imagesByRoom[im.room_id]) imagesByRoom[im.room_id] = im.url;
    }
  }

  return (
    <main className="lux-container py-14 md:py-20">
      <div className="max-w-3xl">
        <div className="lux-kicker">Rooms & Suites</div>
        <h1 className="mt-4 lux-h2">Find your perfect stay</h1>
        <p className="mt-4 text-sm md:text-base lux-muted leading-relaxed">
          Choose from premium rooms and suites designed for comfort, privacy, and a true five-star experience.
        </p>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {rooms.map((r) => {
          const img = imagesByRoom[r.id];
          return (
            <div key={r.id} className="lux-border lux-card rounded-2xl overflow-hidden">
              <div className="h-[220px] bg-black/[0.03]">
                <Img src={img} alt={r.name} />
              </div>

              <div className="p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="text-base font-semibold">{r.name}</div>
                  <div className="text-sm font-semibold text-[var(--accent)]">
                    {formatNGN(r.price_per_night)} <span className="opacity-70">/ night</span>
                  </div>
                </div>

                <p className="mt-3 text-sm lux-muted leading-relaxed line-clamp-3">
                  {r.description || ""}
                </p>

                <div className="mt-5">
                  <Button
                    href={`/rooms/${r.slug}${qs}`}
                    className="!inline-flex !bg-[var(--primary)] !text-white hover:!bg-[var(--primary-2)] !px-5 !py-2 !text-xs"
                  >
                    More Details
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}