import { Link } from "@tanstack/react-router";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`}>
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden>
        <path d="M16 2 L30 10 V22 L16 30 L2 22 V10 Z" fill="oklch(0.68 0.21 42)" />
        <path d="M16 2 L30 10 L16 16 Z" fill="oklch(0.78 0.18 42)" />
        <path d="M16 2 L2 10 L16 16 Z" fill="oklch(0.6 0.2 42)" />
        <path d="M16 16 L16 30 L30 22 Z" fill="oklch(0.55 0.18 42)" />
      </svg>
      <span className="text-lg font-bold tracking-tight text-ink">
        Printreon <span className="text-primary">Club</span>
      </span>
    </Link>
  );
}
