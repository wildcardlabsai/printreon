import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Mail } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "Explore creators — Printreon" },
      { name: "description", content: "Browse 3D printing creators and subscribe to support their STL drops." },
    ],
  }),
  component: Explore,
});

interface Creator {
  id: string; slug: string; display_name: string; short_intro: string | null;
  profile_image_url: string | null; banner_image_url: string | null;
}

function Explore() {
  const [allCreators, setAllCreators] = useState<Creator[] | null>(null);
  const [trending, setTrending] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    supabase.from("creator_profiles")
      .select("id, slug, display_name, short_intro, profile_image_url, banner_image_url")
      .eq("is_published", true)
      .is("suspended_at", null)
      .order("created_at", { ascending: false })
      .limit(60)
      .then(({ data }) => setAllCreators(data ?? []));

    supabase.from("creator_files")
      .select("id, title, slug, download_count, preview_images, creator_profiles(display_name, slug)")
      .eq("is_published", true)
      .is("takedown_at", null)
      .order("download_count", { ascending: false })
      .limit(8)
      .then(({ data }) => setTrending(data ?? []));
  }, []);

  const q = query.trim().toLowerCase();
  const creators =
    allCreators === null
      ? null
      : q
        ? allCreators.filter(
            (c) =>
              c.display_name.toLowerCase().includes(q) ||
              c.slug.toLowerCase().includes(q) ||
              (c.short_intro ?? "").toLowerCase().includes(q)
          )
        : allCreators;

  const joinWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("waitlist").insert({ email, role_interest: "member" });
    if (error) toast.error(error.message);
    else { toast.success("You're on the list."); setEmail(""); }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="container-page py-14">
        <h1 className="text-4xl font-bold text-ink md:text-5xl">Explore creators</h1>
        <p className="mt-3 max-w-xl text-ink-soft">Discover 3D printing designers selling STL, 3MF and printable files through monthly memberships.</p>

        <div className="mt-6 max-w-md">
          <label htmlFor="creator-search" className="sr-only">Search creators</label>
          <input
            id="creator-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search creators, niches, keywords…"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>

        {trending.length > 0 && !q && (
          <div className="mt-10">
            <h2 className="text-xl font-bold text-ink">Trending files</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {trending.map((f: any) => (
                <Link
                  key={f.id}
                  to="/c/$slug"
                  params={{ slug: f.creator_profiles?.slug ?? "" }}
                  className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-0.5"
                >
                  <div className="aspect-[4/3] bg-secondary">
                    {Array.isArray(f.preview_images) && f.preview_images[0] && (
                      <img src={f.preview_images[0]} alt={`${f.title} preview render`} className="h-full w-full object-cover" loading="lazy" />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-ink line-clamp-1">{f.title}</h3>
                    <p className="text-xs text-ink-soft">
                      {f.creator_profiles?.display_name} · {f.download_count} downloads
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}



        {creators === null ? (
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card-soft animate-pulse h-56" />
            ))}
          </div>
        ) : creators.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-border bg-card p-10 text-center shadow-[var(--shadow-soft)]">
            <Sparkles className="mx-auto h-10 w-10 text-primary" />
            <h2 className="mt-4 text-2xl font-bold text-ink">Printreon is opening for creators soon.</h2>
            <p className="mx-auto mt-2 max-w-md text-ink-soft">
              We're onboarding the first wave of 3D printing designers. Join the waitlist to be notified when new creators go live.
            </p>
            <form onSubmit={joinWaitlist} className="mx-auto mt-6 flex max-w-md gap-2">
              <input type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
              <button className="btn-primary"><Mail className="mr-2 h-4 w-4" />Join waitlist</button>
            </form>
            <p className="mt-6 text-sm text-ink-soft">
              Are you a creator? <Link to="/auth" search={{ mode: "signup", as: "creator" }} className="font-semibold text-primary">Start your page →</Link>
            </p>
          </div>
        ) : (
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {creators.map((c) => (
              <Link key={c.id} to="/c/$slug" params={{ slug: c.slug }} className="group overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)]">
                <div className="aspect-[3/1] bg-gradient-to-br from-accent to-secondary" style={c.banner_image_url ? { backgroundImage: `url(${c.banner_image_url})`, backgroundSize: "cover" } : undefined} />
                <div className="p-5">
                  <div className="flex items-center gap-3">
                    {c.profile_image_url ? (
                      <img src={c.profile_image_url} alt={`${c.display_name} profile photo`} className="h-12 w-12 rounded-full object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-accent text-primary flex items-center justify-center font-bold">{c.display_name[0]}</div>
                    )}
                    <div>
                      <h3 className="font-semibold text-ink group-hover:text-primary">{c.display_name}</h3>
                      <p className="text-xs text-ink-soft">@{c.slug}</p>
                    </div>
                  </div>
                  {c.short_intro && <p className="mt-3 text-sm text-ink-soft line-clamp-2">{c.short_intro}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
      <SiteFooter />
    </div>
  );
}
