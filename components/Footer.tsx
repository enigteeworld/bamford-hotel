"use client";

import Link from "next/link";

type FooterProps = {
  brand: { name: string };
  newsletter: {
    title: string;
    subtitle: string;
    placeholder: string;
    button: string;
  };
};

export default function Footer({ brand, newsletter }: FooterProps) {
  return (
    <footer className="mt-16 border-t border-black/10 bg-white">
      <div className="lux-container py-12 grid gap-10 md:grid-cols-3">
        <div>
          <div className="text-xs tracking-[0.35em] font-semibold text-black">{brand?.name || "BAMFORD HOTEL"}</div>
          <p className="mt-3 text-sm text-black/70">
            Premium stays with modern comfort, verified reservations, and seamless payments.
          </p>

          <div className="mt-4 flex gap-4 text-sm">
            <Link href="/rooms" className="text-black/70 hover:text-black">
              Rooms
            </Link>
            <Link href="/gallery" className="text-black/70 hover:text-black">
              Gallery
            </Link>
            <Link href="/contact" className="text-black/70 hover:text-black">
              Contact
            </Link>
          </div>
        </div>

        <div>
          <div className="text-xs tracking-[0.25em] uppercase font-semibold text-black/80">Hours</div>
          <p className="mt-3 text-sm text-black/70">Open 24/7</p>
          <p className="mt-2 text-sm text-black/70">Check-in: 2PM • Check-out: 12PM</p>
        </div>

        <div>
          <div className="text-xs tracking-[0.25em] uppercase font-semibold text-black/80">{newsletter.title}</div>
          <p className="mt-3 text-sm text-black/70">{newsletter.subtitle}</p>

          <form
            className="mt-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            <input
              type="email"
              placeholder={newsletter.placeholder}
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none"
            />
            <button
              type="submit"
              className="rounded-xl bg-[var(--primary)] px-4 py-3 text-xs font-semibold tracking-[0.2em] text-white hover:bg-[var(--primary-2)]"
            >
              {newsletter.button}
            </button>
          </form>
        </div>
      </div>

      <div className="border-t border-black/10">
        <div className="lux-container py-5 text-xs text-black/60">
          © {new Date().getFullYear()} {brand?.name || "BAMFORD HOTEL"} — All rights reserved.
        </div>
      </div>
    </footer>
  );
}