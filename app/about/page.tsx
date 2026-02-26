import { getSiteContent } from "@/lib/getSiteContent";
import { Button } from "@/components/ui/Button";

function Img({ src, alt }: { src?: string; alt: string }) {
  if (!src) return <div className="w-full h-full bg-black/[0.04] flex items-center justify-center text-xs lux-muted">No image</div>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className="w-full h-full object-cover" />;
}

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const c = await getSiteContent([
    "about.kicker",
    "about.title",
    "about.subtitle",
    "about.image1",
    "about.image2",
    "about.section1.title",
    "about.section1.body",
    "about.section2.title",
    "about.section2.body",
    "about.stats.1",
    "about.stats.2",
    "about.stats.3",
  ]);

  return (
    <main>
      <section className="lux-container pt-14 md:pt-20 pb-10">
        <div className="lux-kicker text-[var(--accent)]">{c["about.kicker"] || "About Us"}</div>
        <h1 className="mt-4 lux-h1 text-black/90">{c["about.title"] || "A Five-Star Hospitality Tradition"}</h1>
        <p className="mt-5 max-w-2xl text-sm md:text-base text-black/60 leading-relaxed">
          {c["about.subtitle"] || ""}
        </p>

        <div className="mt-8">
          <Button href="/rooms" className="!bg-[var(--primary)] hover:!bg-[var(--primary-2)]">
            Explore Rooms
          </Button>
        </div>
      </section>

      <section className="lux-container pb-16 md:pb-20">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-[320px] md:h-[420px] rounded-3xl overflow-hidden border border-[var(--line)] bg-black/[0.03]">
            <Img src={c["about.image1"]} alt="About image 1" />
          </div>

          <div className="lux-border lux-card rounded-3xl bg-white p-8 md:p-10">
            <div className="lux-kicker">Our Story</div>
            <h2 className="mt-4 lux-h2">{c["about.section1.title"] || "Our Story"}</h2>
            <p className="mt-5 text-sm md:text-base text-black/60 leading-relaxed">
              {c["about.section1.body"] || ""}
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[c["about.stats.1"], c["about.stats.2"], c["about.stats.3"]].filter(Boolean).map((s, i) => (
                <div key={i} className="rounded-2xl border border-[var(--line)] bg-black/[0.02] p-4 text-center">
                  <div className="text-sm font-semibold text-[var(--primary)]">{s}</div>
                  <div className="mt-1 text-xs text-black/45">Verified hospitality</div>
                </div>
              ))}
            </div>
          </div>

          <div className="lux-border lux-card rounded-3xl bg-white p-8 md:p-10">
            <div className="lux-kicker">Our Promise</div>
            <h2 className="mt-4 lux-h2">{c["about.section2.title"] || "Our Promise"}</h2>
            <p className="mt-5 text-sm md:text-base text-black/60 leading-relaxed">
              {c["about.section2.body"] || ""}
            </p>

            <div className="mt-8 grid gap-3">
              <div className="rounded-2xl border border-[var(--line)] bg-black/[0.02] p-4">
                <div className="text-sm font-semibold text-black/80">Premium Rooms</div>
                <div className="mt-1 text-xs text-black/55">Clean, modern, and designed for calm comfort.</div>
              </div>
              <div className="rounded-2xl border border-[var(--line)] bg-black/[0.02] p-4">
                <div className="text-sm font-semibold text-black/80">Professional Staff</div>
                <div className="mt-1 text-xs text-black/55">Customer-first service with attention to detail.</div>
              </div>
              <div className="rounded-2xl border border-[var(--line)] bg-black/[0.02] p-4">
                <div className="text-sm font-semibold text-black/80">Verified Reservations</div>
                <div className="mt-1 text-xs text-black/55">Payments and proofs confirmed to finalize bookings.</div>
              </div>
            </div>
          </div>

          <div className="h-[320px] md:h-[420px] rounded-3xl overflow-hidden border border-[var(--line)] bg-black/[0.03]">
            <Img src={c["about.image2"]} alt="About image 2" />
          </div>
        </div>
      </section>
    </main>
  );
}
