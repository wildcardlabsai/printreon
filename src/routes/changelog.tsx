import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";

const items = [
  {
    date: "2026-05",
    title: "Stripe Connect payouts + creator email notifications",
    body: "Creators can now onboard to Stripe Connect from dashboard → Payouts to receive subscriber payments directly, with an automatic platform fee split. Subscribers also get an email whenever a creator they follow drops a new file or post. Dashboard empty states (subscribers, files, tiers, announcements) were polished with helpful calls to action.",
  },
  {
    date: "2026-05",
    title: "Embedded Stripe checkout + subscription lifecycle",
    body: "Subscribing to a tier now opens an embedded Stripe checkout. New subscriptions, upgrades/downgrades (immediate + prorated) and cancellations (access until period end, then revoked) are all wired up via Stripe webhooks.",
  },
  {
    date: "2026-05",
    title: "Launch",
    body: "Printreon opens to creators with full creator/member/admin dashboards, file uploads, tier memberships, posts, comments, DMs, bundles, promo codes, wishlists and print log.",
  },
];

export const Route = createFileRoute("/changelog")({
  head: () => ({ meta: [{ title: "Changelog — Printreon" }, { name: "description", content: "What's new in Printreon." }] }),
  component: () => (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container-page max-w-3xl py-16">
        <h1 className="text-4xl font-bold text-ink">Changelog</h1>
        <ul className="mt-8 space-y-6">
          {items.map((i) => (
            <li key={i.date} className="card-soft">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">{i.date}</p>
              <h2 className="mt-1 text-lg font-bold text-ink">{i.title}</h2>
              <p className="mt-2 text-ink-soft">{i.body}</p>
            </li>
          ))}
        </ul>
      </div>
      <SiteFooter />
    </div>
  ),
});
