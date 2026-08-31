import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { supabase } from "@/integrations/supabase/client";

type Entry = {
  id: string;
  title: string;
  body: string;
  entry_date: string;
};

export const Route = createFileRoute("/changelog")({
  head: () => ({
    meta: [
      { title: "Changelog — Printreon" },
      { name: "description", content: "Every new feature, fix and improvement shipped on Printreon." },
      { property: "og:title", content: "Changelog — Printreon" },
      { property: "og:description", content: "Every new feature, fix and improvement shipped on Printreon." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ChangelogPage,
});

function ChangelogPage() {
  const [items, setItems] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("changelog_entries")
      .select("id,title,body,entry_date")
      .eq("is_published", true)
      .order("entry_date", { ascending: false })
      .then(({ data }) => {
        setItems((data as Entry[]) ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container-page max-w-3xl py-16">
        <h1 className="text-4xl font-bold text-ink">Changelog</h1>
        <p className="mt-3 text-ink-soft">What's new on Printreon.</p>
        {loading ? (
          <p className="mt-8 text-sm text-ink-soft">Loading…</p>
        ) : items.length === 0 ? (
          <p className="mt-8 text-sm text-ink-soft">No entries yet — check back soon.</p>
        ) : (
          <ul className="mt-8 space-y-6">
            {items.map((i) => (
              <li key={i.id} className="card-soft">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  {new Date(i.entry_date).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
                </p>
                <h2 className="mt-1 text-lg font-bold text-ink">{i.title}</h2>
                <p className="mt-2 whitespace-pre-wrap text-ink-soft">{i.body}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
