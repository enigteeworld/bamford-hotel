"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavbarProps = {
  brandName?: string;
};

export default function Navbar({ brandName }: NavbarProps) {
  const pathname = usePathname();

  const Brand = brandName || "BAMFORD HOTEL";

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

  return (
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

        <Link
          href="/rooms"
          className="inline-flex items-center rounded-full bg-[var(--primary)] px-6 py-2 text-xs font-semibold tracking-[0.25em] text-white hover:bg-[var(--primary-2)]"
        >
          BOOK NOW
        </Link>
      </div>
    </header>
  );
}