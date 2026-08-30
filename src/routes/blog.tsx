import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SITE_URL } from "@/lib/site";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog — Printreon" },
      { name: "description", content: "Guides on pricing STL memberships, packaging 3D print files and growing a paid maker community." },
      { property: "og:title", content: "Printreon Blog — guides for 3D print creators" },
      { property: "og:description", content: "Guides on pricing STL memberships, packaging 3D print files and growing a paid maker community." },
      { property: "og:url", content: `${SITE_URL}/blog` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/blog` }],
  }),
  component: BlogIndex,
});

const GUIDES = [
  {
    title: "How to price a 3D printing membership",
    summary:
      "Most STL creators start with three tiers: a low entry tier for one model a month, a core tier bundling the full monthly drop, and a commercial-licence tier priced 3–5× the core. Price the core tier at what a single model would sell for individually — subscribers stay for the cadence, not the discount.",
    to: "/pricing" as const,
    cta: "See Printreon pricing and fees",
  },
  {
    title: "Packaging STL, 3MF and OBJ files subscribers actually print",
    summary:
      "Ship pre-supported and raw versions side by side, include a 3MF with your tested profile, and add a short README with layer height, material and print time. Printreon reads those fields into the file card so buyers can filter before they download.",
    to: "/for-creators" as const,
    cta: "How creator file libraries work",
  },
  {
    title: "Turning followers into paying subscribers",
    summary:
      "Free lead-magnet files, an automatic email on every new drop, and referral links do most of the work. The pattern that converts best: publish one free model a month, gate the variants, and email followers the moment the drop lands.",
    to: "/help" as const,
    cta: "Growth tools in the help centre",
  },
];

function BlogIndex() {
  const [posts, setPosts] = useState<any[]>([]);
  useEffect(() => {
    supabase
      .from("blog_posts")
      .select("*")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .then(({ data }) => setPosts(data ?? []));
  }, []);
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container-page py-16">
        <h1 className="text-4xl font-bold text-ink md:text-5xl">The Blog</h1>
        <p className="mt-3 max-w-2xl text-ink-soft">Guides, case studies and tips for 3D creators selling STL files online.</p>
        {posts.length === 0 ? (
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {GUIDES.map((g) => (
              <article key={g.title} className="card-soft">
                <h2 className="text-lg font-bold text-ink">{g.title}</h2>
                <p className="mt-2 text-sm text-ink-soft">{g.summary}</p>
                <Link to={g.to} className="mt-4 inline-flex text-sm font-semibold text-primary">
                  {g.cta} →
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <Link key={p.id} to="/blog/$slug" params={{ slug: p.slug }} className="card-soft hover:border-primary">
                {p.cover_image_url && (
                  <img
                    src={p.cover_image_url}
                    alt={`Cover image for the article “${p.title}”`}
                    className="mb-4 aspect-video w-full rounded-lg object-cover"
                  />
                )}
                <h2 className="text-lg font-bold text-ink">{p.title}</h2>
                {p.excerpt && <p className="mt-2 text-sm text-ink-soft">{p.excerpt}</p>}
                <p className="mt-3 text-xs text-ink-soft">{new Date(p.published_at ?? p.created_at).toLocaleDateString()}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
