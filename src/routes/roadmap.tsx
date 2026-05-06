import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { Check, Loader2 } from "lucide-react";

const groups: Array<{ status: "shipped" | "next" | "later"; items: string[] }> = [
  { status: "shipped", items: ["Creator dashboard", "Tiered memberships", "STL/3MF uploads", "Member dashboard", "Admin tools", "Posts, comments, DMs", "Bundles, promo codes", "Wishlist + collections", "Print log", "Embedded Stripe checkout", "Stripe Connect payouts", "Subscription upgrades, downgrades & cancel", "New-drop email notifications to followers", "Polished dashboard empty states"] },
  { status: "next", items: ["STL 3D viewer in browser", "Weekly creator email digests", "Affiliate program payouts", "Mobile PWA", "Admin moderation queue"] },
  { status: "later", items: ["Print farm integrations", "Marketplace search", "Native iOS/Android apps", "AI auto-tagging for STLs"] },
];

export const Route = createFileRoute("/roadmap")({
  head: () => ({ meta: [{ title: "Roadmap — Printreon" }, { name: "description", content: "What's coming next for Printreon." }] }),
  component: () => (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container-page max-w-4xl py-16">
        <h1 className="text-4xl font-bold text-ink">Roadmap</h1>
        <p className="mt-3 text-ink-soft">A public look at what we've shipped and what's coming.</p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {groups.map((g) => (
            <div key={g.status} className="card-soft">
              <div className="flex items-center gap-2">
                {g.status === "shipped" ? <Check className="h-4 w-4 text-primary" /> : <Loader2 className="h-4 w-4 text-ink-soft" />}
                <h2 className="text-lg font-bold capitalize text-ink">{g.status}</h2>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-ink-soft">
                {g.items.map((i) => <li key={i}>• {i}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <SiteFooter />
    </div>
  ),
});
