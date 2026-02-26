import Link from "next/link";

function Icon({ name }: { name: "facebook" | "instagram" | "twitter" }) {
  if (name === "facebook")
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H8v-3h2.4V9.7c0-2.4 1.4-3.7 3.6-3.7 1 0 2 .2 2 .2v2.2h-1.1c-1.1 0-1.5.7-1.5 1.4V12H16l-.4 3h-2.2v7A10 10 0 0 0 22 12z" />
      </svg>
    );
  if (name === "instagram")
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm10 2H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3zm-5 4a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm6.2-2.2a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
      </svg>
    );
  // X icon
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.9 2H22l-6.8 7.8L23.5 22H17l-5-6.5L6.2 22H3l7.3-8.4L.5 2H7l4.5 6 5.4-6z" />
    </svg>
  );
}

export default function TopBar({
  address,
  email,
  phone,
  socials,
}: {
  address: string;
  email: string;
  phone: string;
  socials: { facebook: string; instagram: string; twitter: string };
}) {
  return (
    <div className="hidden md:block bg-[var(--primary)] text-white/90">
      <div className="lux-container py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <span className="opacity-90">{address}</span>
          <span className="opacity-70">|</span>
          <span className="opacity-90">{email}</span>
          <span className="opacity-70">|</span>
          <span className="opacity-90">{phone}</span>
        </div>

        <div className="flex items-center gap-3">
          <Link href={socials.twitter || "#"} className="hover:text-white" aria-label="X">
            <Icon name="twitter" />
          </Link>
          <Link href={socials.facebook || "#"} className="hover:text-white" aria-label="Facebook">
            <Icon name="facebook" />
          </Link>
          <Link href={socials.instagram || "#"} className="hover:text-white" aria-label="Instagram">
            <Icon name="instagram" />
          </Link>
        </div>
      </div>
    </div>
  );
}
