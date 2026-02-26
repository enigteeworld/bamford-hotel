import { getSiteContent } from "@/lib/getSiteContent";
import BookingBar from "@/components/home/BookingBar";
import { Button } from "@/components/ui/Button";

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

function KickerTitle({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div>
      <div className="lux-kicker">{kicker}</div>
      <h2 className="mt-4 lux-h2">{title}</h2>
    </div>
  );
}

function AmenityIcon({ name }: { name: string }) {
  const common =
    "w-10 h-10 rounded-2xl flex items-center justify-center bg-[rgba(15,90,87,0.12)] text-[var(--primary)]";
  const label = (name || "").toLowerCase();
  const glyph =
    label.includes("wifi")
      ? "📶"
      : label.includes("spa")
      ? "💆"
      : label.includes("gym")
      ? "🏋️"
      : label.includes("airport")
      ? "🚗"
      : label.includes("desk")
      ? "🕒"
      : label.includes("restaurant")
      ? "🍽️"
      : label.includes("breakfast")
      ? "☕"
      : "⭐";
  return (
    <div className={common} aria-hidden="true">
      {glyph}
    </div>
  );
}

function slugifyFallback(name?: string) {
  return (name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default async function Home() {
  const c = await getSiteContent([
    // hero
    "home.hero.title",
    "home.hero.subtitle",
    "home.hero.slide1",
    "home.hero.slide1",
    "home.hero.slide2",
    "home.hero.slide3",
    "home.booking.cta",

    // rooms section
    "home.rooms.kicker",
    "home.rooms.title",
    "home.rooms.subtitle",
    "home.rooms.1.slug",
    "home.rooms.1.name",
    "home.rooms.1.price",
    "home.rooms.1.desc",
    "home.rooms.1.image",
    "home.rooms.2.slug",
    "home.rooms.2.name",
    "home.rooms.2.price",
    "home.rooms.2.desc",
    "home.rooms.2.image",
    "home.rooms.3.slug",
    "home.rooms.3.name",
    "home.rooms.3.price",
    "home.rooms.3.desc",
    "home.rooms.3.image",
    "home.rooms.cta",

    // split sections
    "home.split1.kicker",
    "home.split1.title",
    "home.split1.body",
    "home.split1.image",
    "home.split1.cta",
    "home.split2.kicker",
    "home.split2.title",
    "home.split2.body",
    "home.split2.image",
    "home.split2.cta",

    // amenities
    "home.amenities.kicker",
    "home.amenities.title",
    "home.amenities.1.title",
    "home.amenities.1.body",
    "home.amenities.2.title",
    "home.amenities.2.body",
    "home.amenities.3.title",
    "home.amenities.3.body",
    "home.amenities.4.title",
    "home.amenities.4.body",
    "home.amenities.5.title",
    "home.amenities.5.body",
    "home.amenities.6.title",
    "home.amenities.6.body",

    // news tabs
    "home.news.kicker",
    "home.news.title",
    "home.news.tab1",
    "home.news.tab2",
    "home.news.tab3",
    "home.news.1.title",
    "home.news.1.body",
    "home.news.1.image",
    "home.news.2.title",
    "home.news.2.body",
    "home.news.2.image",
    "home.news.3.title",
    "home.news.3.body",
    "home.news.3.image",

    // gallery
    "home.gallery.kicker",
    "home.gallery.title",
    "home.gallery.cta",
    "home.gallery.image1",
    "home.gallery.image2",
    "home.gallery.image3",
  ]);

  const bgFallback = c["home.hero.slide1"] || "";
  const slide1 = c["home.hero.slide1"] || bgFallback;
  const slide2 = c["home.hero.slide2"] || bgFallback;
  const slide3 = c["home.hero.slide3"] || bgFallback;

  const rooms = [
    {
      slug: c["home.rooms.1.slug"] || slugifyFallback(c["home.rooms.1.name"]),
      name: c["home.rooms.1.name"],
      price: c["home.rooms.1.price"],
      desc: c["home.rooms.1.desc"],
      image: c["home.rooms.1.image"],
    },
    {
      slug: c["home.rooms.2.slug"] || slugifyFallback(c["home.rooms.2.name"]),
      name: c["home.rooms.2.name"],
      price: c["home.rooms.2.price"],
      desc: c["home.rooms.2.desc"],
      image: c["home.rooms.2.image"],
    },
    {
      slug: c["home.rooms.3.slug"] || slugifyFallback(c["home.rooms.3.name"]),
      name: c["home.rooms.3.name"],
      price: c["home.rooms.3.price"],
      desc: c["home.rooms.3.desc"],
      image: c["home.rooms.3.image"],
    },
  ];

  const amenities = [
    { title: c["home.amenities.1.title"], body: c["home.amenities.1.body"] },
    { title: c["home.amenities.2.title"], body: c["home.amenities.2.body"] },
    { title: c["home.amenities.3.title"], body: c["home.amenities.3.body"] },
    { title: c["home.amenities.4.title"], body: c["home.amenities.4.body"] },
    { title: c["home.amenities.5.title"], body: c["home.amenities.5.body"] },
    { title: c["home.amenities.6.title"], body: c["home.amenities.6.body"] },
  ].filter((a) => a.title);

  return (
    <main>
      {/* HERO */}
      <section className="hero relative overflow-hidden">
        {/* Slider is absolute, so it never pushes text down */}
        <div className="heroSlider absolute inset-0">
          <div
            id="hero-slide-1"
            className="heroSlide heroSlide1"
            style={{ backgroundImage: slide1 ? `url(${slide1})` : undefined }}
          />
          <div
            id="hero-slide-2"
            className="heroSlide heroSlide2"
            style={{ backgroundImage: slide2 ? `url(${slide2})` : undefined }}
          />
          <div
            id="hero-slide-3"
            className="heroSlide heroSlide3"
            style={{ backgroundImage: slide3 ? `url(${slide3})` : undefined }}
          />
        </div>

        {/* overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/55 to-black/35" />
        <div className="absolute inset-0 [background:radial-gradient(50%_40%_at_20%_10%,rgba(15,90,87,.45)_0%,rgba(0,0,0,0)_70%)]" />

        {/* arrows */}
        <div className="absolute inset-y-0 left-3 md:left-6 flex items-center z-20">
          <a href="#hero-slide-3" className="heroArrow" aria-label="Previous slide" title="Previous">
            ‹
          </a>
        </div>
        <div className="absolute inset-y-0 right-3 md:right-6 flex items-center z-20">
          <a href="#hero-slide-2" className="heroArrow" aria-label="Next slide" title="Next">
            ›
          </a>
        </div>

        <div className="relative lux-container pt-14 md:pt-24 pb-12 z-10">
          <div className="heroKicker text-white/85">Welcome to a world-class stay</div>

          <h1 className="heroTitle text-white">
            {c["home.hero.title"] || "Five Star Comfort, Modern Luxury"}
          </h1>

          <p className="heroSubtitle text-white/80">{c["home.hero.subtitle"] || ""}</p>

          <div className="mt-10 flex flex-wrap gap-3">
            <Button href="/rooms" className="!bg-[var(--primary)] !text-white hover:!bg-[var(--primary-2)]">
              Explore Rooms
            </Button>
            <Button
              href="/gallery"
              variant="ghost"
              className="!bg-white/10 !text-white !border-white/25 hover:!bg-white/15"
            >
              View Gallery
            </Button>
          </div>

          <div className="mt-12">
            <BookingBar ctaText={c["home.booking.cta"] || "Book Now"} />
          </div>
        </div>

        <style>{`
          .hero { min-height: 560px; }
          @media (min-width: 768px) { .hero { min-height: 720px; } }

          /* ✅ This prevents the "grey flash" if all slides are briefly transparent */
          .heroSlider { z-index: 0; background: #000; }

          .heroSlide {
            position: absolute;
            inset: 0;
            background-size: cover;
            background-position: center;
            opacity: 0;
            transform: translateZ(0) scale(1.03);
            will-change: opacity, transform;
            backface-visibility: hidden;
            -webkit-backface-visibility: hidden;
          }

          /* ✅ smoother crossfade (no blank moment) */
          /* 24s total, each slide ~8s, with overlap during transitions */
          .heroSlide1 { animation: heroFade1 24s infinite; }
          .heroSlide2 { animation: heroFade2 24s infinite; }
          .heroSlide3 { animation: heroFade3 24s infinite; }

          /* Slide 1 starts visible immediately */
          @keyframes heroFade1 {
            0%   { opacity: 1; transform: translateZ(0) scale(1.00); }
            30%  { opacity: 1; transform: translateZ(0) scale(1.00); }
            /* overlap fade: slide2 begins to appear BEFORE slide1 disappears */
            38%  { opacity: 0; transform: translateZ(0) scale(1.03); }
            100% { opacity: 0; transform: translateZ(0) scale(1.03); }
          }

          @keyframes heroFade2 {
            0%   { opacity: 0; transform: translateZ(0) scale(1.03); }
            30%  { opacity: 0; transform: translateZ(0) scale(1.03); }
            38%  { opacity: 1; transform: translateZ(0) scale(1.00); }
            62%  { opacity: 1; transform: translateZ(0) scale(1.00); }
            70%  { opacity: 0; transform: translateZ(0) scale(1.03); }
            100% { opacity: 0; transform: translateZ(0) scale(1.03); }
          }

          @keyframes heroFade3 {
            0%   { opacity: 0; transform: translateZ(0) scale(1.03); }
            62%  { opacity: 0; transform: translateZ(0) scale(1.03); }
            70%  { opacity: 1; transform: translateZ(0) scale(1.00); }
            94%  { opacity: 1; transform: translateZ(0) scale(1.00); }
            /* overlap back into slide1 */
            100% { opacity: 0; transform: translateZ(0) scale(1.03); }
          }

          /* ✅ If user clicks an anchor, lock that slide */
          #hero-slide-1:target,
          #hero-slide-2:target,
          #hero-slide-3:target {
            opacity: 1 !important;
            transform: translateZ(0) scale(1.00) !important;
            animation: none !important;
          }

          .heroArrow{
            width: 48px;
            height: 48px;
            border-radius: 999px;
            display:flex;
            align-items:center;
            justify-content:center;
            background: rgba(0,0,0,0.18);
            border: 1px solid rgba(255,255,255,0.25);
            color: #fff;
            text-decoration: none;
            font-size: 30px;
            line-height: 1;
            backdrop-filter: blur(10px);
            transition: transform 150ms ease, background 150ms ease;
          }
          .heroArrow:hover{ background: rgba(0,0,0,0.24); transform: scale(1.03); }
          .heroArrow:active{ transform: scale(0.98); }

          .heroKicker{
            text-transform: uppercase;
            letter-spacing: 0.32em;
            font-size: 11px;
            opacity: 0.92;
            text-shadow: 0 2px 22px rgba(0,0,0,0.35);
          }
          .heroTitle{
            margin-top: 18px;
            font-weight: 700;
            letter-spacing: -0.02em;
            line-height: 1.03;
            font-size: 42px;
            max-width: 900px;
            text-shadow: 0 10px 44px rgba(0,0,0,0.45);
          }
          @media (min-width: 768px){
            .heroTitle{ font-size: 64px; }
          }
          .heroSubtitle{
            margin-top: 18px;
            font-size: 16px;
            line-height: 1.75;
            max-width: 620px;
            text-shadow: 0 8px 28px rgba(0,0,0,0.40);
          }
          @media (min-width: 768px){
            .heroSubtitle{ font-size: 18px; }
          }
        `}</style>
      </section>

      {/* ROOMS & SUITES */}
      <section className="lux-container py-16 md:py-20">
        <div className="grid gap-6 md:grid-cols-2 md:items-end">
          <KickerTitle
            kicker={c["home.rooms.kicker"] || "Rooms & Suites"}
            title={c["home.rooms.title"] || "Choose a room that fits your vibe"}
          />
          <p className="text-sm md:text-base lux-muted leading-relaxed md:pb-2">{c["home.rooms.subtitle"] || ""}</p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {rooms.map((r, idx) => {
            const href = r.slug ? `/rooms/${r.slug}` : "/rooms";
            return (
              <div key={idx} className="lux-border lux-card rounded-2xl overflow-hidden">
                <div className="h-[220px] bg-black/[0.03]">
                  <Img src={r.image} alt={r.name || `Room ${idx + 1}`} />
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-base font-semibold">{r.name || `Room ${idx + 1}`}</div>
                    <div className="text-sm font-semibold text-[var(--accent)]">{r.price || ""}</div>
                  </div>

                  <p className="mt-3 text-sm lux-muted leading-relaxed">{r.desc || ""}</p>

                  <div className="mt-5">
                    <Button
                      href={href}
                      className="!inline-flex !bg-[var(--primary)] !text-white hover:!bg-[var(--primary-2)] !px-5 !py-2 !text-xs"
                    >
                      {c["home.rooms.cta"] || "More Details"}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SPLIT SECTIONS */}
      <section className="border-y border-[var(--line)] bg-white/70">
        <div className="lux-container py-16 md:py-20 grid gap-0 md:grid-cols-2">
          <div className="min-h-[320px] md:min-h-[420px] bg-black/[0.03]">
            <Img src={c["home.split1.image"]} alt="Accommodation" />
          </div>

          <div className="p-8 md:p-12 bg-[#fffdf9]">
            <div className="lux-kicker text-[var(--accent)]">{c["home.split1.kicker"] || "Accommodation"}</div>
            <div className="mt-4 text-4xl tracking-[0.2em] uppercase font-semibold text-black/85">
              {c["home.split1.title"] || "LOREM IPSUM"}
            </div>
            <div className="mt-6 max-w-xl text-sm md:text-base lux-muted leading-relaxed">{c["home.split1.body"] || ""}</div>
            <div className="mt-8">
              <Button
                href="/rooms"
                className="!rounded-none !px-8 !py-3 !text-xs !tracking-[0.3em] uppercase !bg-[var(--accent)] !text-white hover:!bg-[var(--accent-2)]"
              >
                {c["home.split1.cta"] || "Book Now"} →
              </Button>
            </div>
          </div>

          <div className="p-8 md:p-12 bg-[#fffdf9]">
            <div className="lux-kicker text-[var(--accent)]">{c["home.split2.kicker"] || "Hospitality tradition"}</div>
            <div className="mt-4 text-4xl tracking-[0.2em] uppercase font-semibold text-black/85">
              {c["home.split2.title"] || "LOREM IPSUM"}
            </div>
            <div className="mt-6 max-w-xl text-sm md:text-base lux-muted leading-relaxed">{c["home.split2.body"] || ""}</div>
            <div className="mt-8">
              <Button
                href="/rooms"
                className="!rounded-none !px-8 !py-3 !text-xs !tracking-[0.3em] uppercase !bg-[var(--primary)] !text-white hover:!bg-[var(--primary-2)]"
              >
                {c["home.split2.cta"] || "Explore Rooms"} →
              </Button>
            </div>
          </div>

          <div className="min-h-[320px] md:min-h-[420px] bg-black/[0.03]">
            <Img src={c["home.split2.image"]} alt="Hospitality tradition" />
          </div>
        </div>
      </section>

      {/* AMENITIES */}
      <section className="lux-container py-16 md:py-20">
        <KickerTitle
          kicker={c["home.amenities.kicker"] || "Amenities"}
          title={c["home.amenities.title"] || "Everything you need for a world-class stay"}
        />

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {amenities.map((a, i) => (
            <div key={i} className="lux-border lux-card rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <AmenityIcon name={a.title as string} />
                <div>
                  <div className="font-semibold text-[var(--primary)]">{a.title}</div>
                  <p className="mt-2 text-sm lux-muted leading-relaxed">{a.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* LATEST NEWS */}
      <section className="bg-white/75 border-y border-[var(--line)]">
        <div className="lux-container py-16 md:py-20">
          <KickerTitle kicker={c["home.news.kicker"] || "Latest News"} title={c["home.news.title"] || "Stay updated"} />

          <div className="mt-8 flex flex-wrap gap-2">
            {[c["home.news.tab1"], c["home.news.tab2"], c["home.news.tab3"]]
              .filter(Boolean)
              .map((t, i) => (
                <span key={i} className="px-4 py-2 rounded-full text-xs font-semibold border border-[var(--line)] bg-white">
                  {t}
                </span>
              ))}
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {[
              { title: c["home.news.1.title"], body: c["home.news.1.body"], image: c["home.news.1.image"] },
              { title: c["home.news.2.title"], body: c["home.news.2.body"], image: c["home.news.2.image"] },
              { title: c["home.news.3.title"], body: c["home.news.3.body"], image: c["home.news.3.image"] },
            ].map((n, idx) => (
              <div key={idx} className="lux-border lux-card rounded-2xl overflow-hidden">
                <div className="h-[190px] bg-black/[0.03]">
                  <Img src={n.image} alt={n.title || `News ${idx + 1}`} />
                </div>
                <div className="p-6">
                  <div className="font-semibold">{n.title || `News ${idx + 1}`}</div>
                  <p className="mt-3 text-sm lux-muted leading-relaxed">{n.body || ""}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section className="lux-container py-16 md:py-20">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <KickerTitle kicker={c["home.gallery.kicker"] || "Our Gallery"} title={c["home.gallery.title"] || "A glimpse of the experience"} />
          <Button href="/gallery" className="!bg-[var(--primary)] !text-white hover:!bg-[var(--primary-2)]">
            {c["home.gallery.cta"] || "View More"}
          </Button>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-12">
          <div className="md:col-span-5 h-[260px] rounded-2xl overflow-hidden lux-border bg-black/[0.03]">
            <Img src={c["home.gallery.image1"]} alt="Gallery 1" />
          </div>
          <div className="md:col-span-4 h-[260px] rounded-2xl overflow-hidden lux-border bg-black/[0.03]">
            <Img src={c["home.gallery.image2"]} alt="Gallery 2" />
          </div>
          <div className="md:col-span-3 h-[260px] rounded-2xl overflow-hidden lux-border bg-black/[0.03]">
            <Img src={c["home.gallery.image3"]} alt="Gallery 3" />
          </div>
        </div>
      </section>
    </main>
  );
}
