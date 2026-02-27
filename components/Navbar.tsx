"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

type NavbarProps = {
  brandName?: string;
};

export default function Navbar({ brandName }: NavbarProps) {
  const pathname = usePathname();
  const Brand = brandName || "BAMFORD HOTEL";

  const [open, setOpen] = useState(false);

  const links = useMemo(
    () => [
      { href: "/rooms", label: "Rooms" },
      { href: "/gallery", label: "Gallery" },
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
    ],
    []
  );

  function isActive(href: string) {
    return pathname === href || (href !== "/" && pathname?.startsWith(href));
  }

  useEffect(() => {
    // close drawer on route change
    setOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    // lock scroll while drawer is open
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    // ESC to close
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="w-full border-b border-black/10 bg-white/80 backdrop-blur relative z-50">
      <div className="lux-container h-16 flex items-center justify-between gap-3">
        <Link href="/" className="text-xs tracking-[0.35em] font-semibold text-black">
          {Brand}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={[
                "text-sm font-medium transition-colors",
                isActive(l.href) ? "text-black" : "text-black/70 hover:text-black",
              ].join(" ")}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* Book now */}
          <Link
            href="/rooms"
            className="inline-flex items-center rounded-full bg-[var(--primary)] px-4 md:px-6 py-2 text-[11px] md:text-xs font-semibold tracking-[0.25em] text-white hover:bg-[var(--primary-2)] whitespace-nowrap"
          >
            BOOK NOW
          </Link>

          {/* Mobile hamburger */}
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className="md:hidden inline-flex items-center justify-center h-10 w-10 rounded-xl border border-black/10 bg-white hover:bg-black/[0.03]"
          >
            <span className="sr-only">Open menu</span>
            <div className="grid gap-1">
              <span className="block h-[2px] w-5 bg-black/80" />
              <span className="block h-[2px] w-5 bg-black/80" />
              <span className="block h-[2px] w-5 bg-black/80" />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-[60]">
          {/* backdrop */}
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />

          {/* panel */}
          <aside className="absolute right-0 top-0 h-full w-[86%] max-w-sm bg-white shadow-2xl border-l border-black/10">
            <div className="h-16 px-5 flex items-center justify-between border-b border-black/10">
              <div className="text-xs tracking-[0.35em] font-semibold text-black">{Brand}</div>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="inline-flex items-center justify-center h-10 w-10 rounded-xl border border-black/10 bg-white hover:bg-black/[0.03]"
              >
                <span className="text-xl leading-none">×</span>
              </button>
            </div>

            <div className="p-5">
              <div className="grid gap-2">
                {links.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={[
                      "flex items-center justify-between rounded-2xl border px-4 py-4 text-sm font-semibold",
                      isActive(l.href)
                        ? "border-[var(--primary)] bg-[rgba(15,90,87,0.08)] text-[var(--primary)]"
                        : "border-black/10 bg-white text-black hover:bg-black/[0.02]",
                    ].join(" ")}
                  >
                    <span>{l.label}</span>
                    <span className="text-black/40">→</span>
                  </Link>
                ))}
              </div>

              <div className="mt-6 rounded-2xl border border-black/10 bg-[#fffdf9] p-4">
                <div className="text-[11px] uppercase tracking-[0.3em] text-black/60">Quick action</div>
                <Link
                  href="/rooms"
                  className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-[var(--primary)] px-6 py-3 text-xs font-semibold tracking-[0.25em] text-white hover:bg-[var(--primary-2)]"
                >
                  BOOK NOW
                </Link>
                <div className="mt-3 text-xs text-black/55 leading-relaxed">
                  Browse rooms, reserve, and pay securely.
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </header>
  );
}