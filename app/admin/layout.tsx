import Link from "next/link";

export const dynamic = "force-dynamic";

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center rounded-xl border border-[var(--line)] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] hover:bg-black/[0.02]"
    >
      {label}
    </Link>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="lux-container py-8 md:py-10">
      <div className="lux-border lux-card rounded-3xl bg-white overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-[var(--line)] p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="lux-kicker">Admin Panel</div>
            <div className="mt-1 text-lg font-semibold">Dashboard</div>
          </div>

          <div className="flex flex-wrap gap-2">
            <NavLink href="/admin" label="Content" />
            <NavLink href="/admin/rooms" label="Rooms" />
            <NavLink href="/admin/bookings" label="Bookings" />
          </div>
        </div>

        <div className="p-4 md:p-6">{children}</div>
      </div>
    </div>
  );
}