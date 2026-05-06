import { Link } from "@tanstack/react-router";
import logoSrc from "@/assets/printreon-logo.png";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`} aria-label="Printreon — 3D Creator Memberships">
      <img
        src={logoSrc}
        alt="Printreon"
        className="h-8 w-auto md:h-9"
        width={180}
        height={48}
      />
    </Link>
  );
}
