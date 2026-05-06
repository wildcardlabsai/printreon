import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { PARTNER } from "@/lib/site";

export const Route = createFileRoute("/press")({
  head: () => ({ meta: [{ title: "Press — Printreon" }, { name: "description", content: "Press kit, brand assets and partnership details." }] }),
  component: () => (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container-page max-w-3xl py-16">
        <h1 className="text-4xl font-bold text-ink">Press &amp; Brand</h1>
        <p className="mt-3 text-ink-soft">For media inquiries: <a href="mailto:press@printreon.com" className="text-primary">press@printreon.com</a></p>
        <h2 className="mt-10 text-2xl font-bold text-ink">About Printreon</h2>
        <p className="mt-2 text-ink-soft">Printreon (printreon.com) is the membership platform built specifically for 3D printing creators.</p>
        <h2 className="mt-8 text-2xl font-bold text-ink">Partnership</h2>
        <p className="mt-2 text-ink-soft">
          Printreon is partnered with{" "}
          <a href={PARTNER.url} target="_blank" rel="noreferrer" className="font-semibold text-primary hover:underline">{PARTNER.name}</a>{" "}
          (www.makermindapp.com), {PARTNER.tagline}.
        </p>
        <h2 className="mt-8 text-2xl font-bold text-ink">Brand</h2>
        <ul className="mt-2 space-y-1 text-ink-soft">
          <li>Primary orange: <code>oklch(0.68 0.21 42)</code></li>
          <li>Wordmark: "Printreon <span className="text-primary">Club</span>"</li>
          <li>Always pair with the printreon.com domain</li>
        </ul>
      </div>
      <SiteFooter />
    </div>
  ),
});
