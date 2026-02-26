import { getContentMap } from "@/lib/content";
import { Button } from "@/components/ui/Button";

function asString(v: any) {
  return typeof v === "string" ? v : "";
}

function tryParseJsonArray(v: any): string[] {
  const s = asString(v).trim();
  if (!s) return [];
  try {
    const parsed = JSON.parse(s);
    if (Array.isArray(parsed)) return parsed.map((x) => String(x)).filter(Boolean);
    return [];
  } catch {
    return [];
  }
}

function extractGalleryImages(c: Record<string, any>): string[] {
  // 1) Common JSON array keys
  const candidates = [
    "gallery.images",
    "site.gallery.images",
    "home.gallery.images",
    "homepage.gallery.images",
    "site.home.gallery.images",
    "gallery.items",
    "site.gallery.items",
    "home.gallery.items",
  ];

  for (const key of candidates) {
    const arr = tryParseJsonArray(c[key]);
    if (arr.length) return arr;
  }

  // 2) Keys like gallery.image.1, gallery.image.2 ...
  const dotted = Object.keys(c)
    .filter((k) => k.startsWith("gallery.image.") || k.startsWith("home.gallery.image.") || k.startsWith("site.gallery.image."))
    .sort((a, b) => a.localeCompare(b))
    .map((k) => asString(c[k]).trim())
    .filter(Boolean);

  if (dotted.length) return dotted;

  // 3) Last resort: any key that looks like a gallery URL list
  const loose = Object.keys(c)
    .filter((k) => k.toLowerCase().includes("gallery") && asString(c[k]).includes("http"))
    .map((k) => asString(c[k]).trim())
    .filter(Boolean);

  return loose;
}

function Img({ src, alt }: { src?: string; alt: string }) {
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

export default async function GalleryPage() {
  const c = await getContentMap();
  const images = extractGalleryImages(c);

  return (
    <main className="lux-container py-14 md:py-20">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div className="max-w-2xl">
          <div className="lux-kicker">Our Gallery</div>
          <h1 className="mt-4 lux-h2">A glimpse of the experience</h1>
          <p className="mt-4 text-sm md:text-base lux-muted leading-relaxed">
            Explore curated moments from our rooms, spaces, and hospitality.
          </p>
        </div>

        <Button
          href="/"
          className="!inline-flex !bg-[var(--primary)] !text-white hover:!bg-[var(--primary-2)] !px-5 !py-2 !text-xs"
        >
          Back Home
        </Button>
      </div>

      {images.length === 0 ? (
        <div className="mt-10 lux-border lux-card rounded-3xl bg-white p-8">
          <div className="text-sm font-semibold">No gallery images found</div>
          <p className="mt-2 text-sm lux-muted">
            Your homepage gallery is being saved in content, but this page didn’t find any matching gallery keys yet.
            <br />
            If you tell me the exact keys your admin editor writes (from the table), I can lock this to the correct key.
          </p>
        </div>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((url, idx) => (
            <div key={`${url}_${idx}`} className="lux-border lux-card rounded-2xl overflow-hidden bg-white">
              <div className="aspect-[4/3] bg-black/[0.03]">
                <Img src={url} alt={`Gallery image ${idx + 1}`} />
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}