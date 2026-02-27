"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

type NavbarProps = {
  brandName?: string;
};

export default function Navbar({ brandName }: NavbarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const Brand = useMemo(() => brandName || "BAMFORD HOTEL", [brandName]);

  // Close menu on route change
  useEffect(() => {
    setOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Lock body scroll while menu open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const navLink = (href: string, label: string) => {
    const active = pathname === href || (href !== "/" && pathname?.startsWith(href));
    return (
      <Link
        href={href}
        className={[
          "text-sm font-medium transition-colors",
          active ? "text-black" : "text-black/70 hover:text-black",
        ].join(" ")}
      >
        {label}
      </Link>
    );
  };

  const MobileItem = ({ href, label }: { href: string; label: string }) => {
    const active = pathname === href || (href !== "/" && pathname?.startsWith(href));
    return (
      <Link
        href={href}
        className={[
          "w-full rounded-2xl px-5 py-4 flex items-center justify-between",
          "border border-black/10 bg-white",
          "shadow-[0_18px_60px_rgba(0,0,0,0.06)]",
          active ? "ring-2 ring-[var(--primary)]/25" : "hover:bg-black/[0.02]",
        ].join(" ")}
      >
        <span className={["text-base font-semibold", active ? "text-[var(--primary)]" : "text-black"].join(" ")}>
          {label}
        </span>
        <span className="text-black/35 text-xl">→</span>
      </Link>
    );
  };

  return (
    <>
      <header className="w-full border-b border-black/10 bg-white/80 backdrop-blur">
        <div className="lux-container h-16 flex items-center justify-between">
          <Link href="/" className="text-xs tracking-[0.35em] font-semibold text-black">
            {Brand}
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLink("/rooms", "Rooms")}
            {navLink("/gallery", "Gallery")}
            {navLink("/about", "About")}
            {navLink("/contact", "Contact")}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/rooms"
              className="inline-flex items-center justify-center rounded-full bg-[var(--primary)] px-5 py-2 text-xs font-semibold tracking-[0.25em] text-white hover:bg-[var(--primary-2)] whitespace-nowrap shrink-0"
            >
              BOOK NOW
            </Link>

            {/* Mobile hamburger */}
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-2xl border border-black/10 bg-white hover:bg-black/[0.02]"
              aria-label="Open menu"
              onClick={() => setOpen(true)}
            >
              <span className="text-xl leading-none">☰</span>
            </button>
          </div>
        </div>
      </header>

      {/* ✅ Full-screen fixed mobile menu */}
      {open ? (
        <div
          className="fixed inset-0 z-[9999]"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile menu"
        >
          {/* backdrop */}
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-black/35"
            onClick={() => setOpen(false)}
          />

          {/* panel */}
          <div className="absolute inset-x-0 top-0 bg-white/92 backdrop-blur-xl border-b border-black/10">
            <div className="lux-container h-16 flex items-center justify-between">
              <div className="text-xs tracking-[0.35em] font-semibold text-black">{Brand}</div>

              <button
                type="button"
                className="inline-flex items-center justify-center w-11 h-11 rounded-2xl border border-black/10 bg-white hover:bg-black/[0.02]"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
              >
                <span className="text-xl leading-none">✕</span>
              </button>
            </div>
          </div>

          {/* content */}
          <div className="absolute inset-x-0 top-16 bottom-0 overflow-auto">
            <div className="lux-container py-6">
              <div className="grid gap-4">
                <MobileItem href="/rooms" label="Rooms" />
                <MobileItem href="/gallery" label="Gallery" />
                <MobileItem href="/about" label="About" />
                <MobileItem href="/contact" label="Contact" />

                <div className="mt-2 rounded-2xl border border-black/10 bg-white p-5 shadow-[0_18px_60px_rgba(0,0,0,0.06)]">
                  <div className="text-[11px] tracking-[0.32em] uppercase text-black/60">Quick Action</div>
                  <Link
                    href="/rooms"
                    className="mt-3 block w-full rounded-full bg-[var(--primary)] px-6 py-4 text-center text-xs font-semibold tracking-[0.25em] text-white hover:bg-[var(--primary-2)]"
                  >
                    BOOK NOW
                  </Link>
                  <div className="mt-3 text-sm text-black/60">
                    Browse rooms, reserve, and pay securely.
                  </div>
                </div>
              </div>

              <div className="h-10" />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}