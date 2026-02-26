import Link from "next/link";
import { cn } from "./cn";

type Props = {
  href?: string;
  children: React.ReactNode;
  variant?: "primary" | "ghost" | "teal";
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
};

export function Button({
  href,
  children,
  variant = "primary",
  className,
  type = "button",
  disabled,
  onClick,
}: Props) {
  const base =
    "inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition " +
    "focus:outline-none focus:ring-2 focus:ring-black/10 disabled:opacity-50 disabled:cursor-not-allowed";

  const styles =
    variant === "primary"
      ? "bg-[var(--orange)] text-white hover:bg-[var(--orange2)]"
      : variant === "teal"
      ? "bg-[var(--teal)] text-white hover:bg-[var(--teal2)]"
      : "bg-white text-[var(--text)] border border-[var(--line)] hover:bg-black/[0.03]";

  const cls = cn(base, styles, className);

  if (href) return <Link className={cls} href={href}>{children}</Link>;

  return (
    <button type={type} className={cls} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}
