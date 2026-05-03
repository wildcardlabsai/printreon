import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";

const items = [
  { date: "2026-05", title: "Launch", body: "MakerMind Club opens to creators with full creator/member/admin dashboards, file uploads, tier memberships, posts, comments, DMs, bundles, promo codes, wishlists, print log and more." },
];

export const Route = createFileRoute("/changelog")({
  head: () => ({ meta: [{ title: "Changelog — MakerMind Club" }, { name: "description", content: "What's new in MakerMind Club." }] }),
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
