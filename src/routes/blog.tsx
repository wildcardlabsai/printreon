import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SITE_URL, blogUrl } from "@/lib/site";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog — Printreon" },
      { name: "description", content: "Stories, guides and tips for 3D printing creators selling STL files online." },
      { property: "og:title", content: "Printreon Blog" },
      { property: "og:url", content: `${SITE_URL}/blog` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/blog` }],
  }),
  component: BlogIndex,
});

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
          <p className="mt-10 text-ink-soft">No posts yet — first articles coming soon.</p>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <Link key={p.id} to="/blog/$slug" params={{ slug: p.slug }} className="card-soft hover:border-primary">
                {p.cover_image_url && <img src={p.cover_image_url} alt="" className="mb-4 aspect-video w-full rounded-lg object-cover" />}
                <h2 className="text-lg font-bold text-ink">{p.title}</h2>
                {p.excerpt && <p className="mt-2 text-sm text-ink-soft">{p.excerpt}</p>}
                <p className="mt-3 text-xs text-ink-soft">{new Date(p.published_at ?? p.created_at).toLocaleDateString()}</p>
                <p className="sr-only">{blogUrl(p.slug)}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
