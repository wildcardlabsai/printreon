import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { PARTNER } from "@/lib/site";

export const Route = createFileRoute("/press")({
  head: () => ({ meta: [{ title: "Press — MakerMind Club" }, { name: "description", content: "Press kit, brand assets and partnership details." }] }),
  component: () => (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container-page max-w-3xl py-16">
        <h1 className="text-4xl font-bold text-ink">Press &amp; Brand</h1>
        <p className="mt-3 text-ink-soft">For media inquiries: <a href="mailto:press@makermind.club" className="text-primary">press@makermind.club</a></p>
        <h2 className="mt-10 text-2xl font-bold text-ink">About MakerMind Club</h2>
        <p className="mt-2 text-ink-soft">MakerMind Club (makermind.club) is the membership platform built specifically for 3D printing creators.</p>
        <h2 className="mt-8 text-2xl font-bold text-ink">Partnership</h2>
        <p className="mt-2 text-ink-soft">
          MakerMind Club is partnered with{" "}
          <a href={PARTNER.url} target="_blank" rel="noreferrer" className="font-semibold text-primary hover:underline">{PARTNER.name}</a>{" "}
          (www.makermindapp.com), {PARTNER.tagline}.
        </p>
        <h2 className="mt-8 text-2xl font-bold text-ink">Brand</h2>
        <ul className="mt-2 space-y-1 text-ink-soft">
          <li>Primary orange: <code>oklch(0.68 0.21 42)</code></li>
          <li>Wordmark: "MakerMind <span className="text-primary">Club</span>"</li>
          <li>Always pair with the makermind.club domain</li>
        </ul>
      </div>
      <SiteFooter />
    </div>
  ),
});
