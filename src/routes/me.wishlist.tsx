import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteChrome";
import { MemberNav } from "@/components/MemberNav";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/me/wishlist")({
  head: () => ({ meta: [{ title: "Wishlist — Printreon" }] }),
  component: WishlistPage,
});

function WishlistPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("wishlist").select("file_id, created_at, creator_files(id,title,category,creator_id)").eq("user_id", user.id);
      setItems(data ?? []);
    })();
  }, [user]);
  return (
    <div className="min-h-screen bg-surface">
      <SiteHeader />
      <div className="container-page py-8">
        <MemberNav />
        <h1 className="text-2xl font-bold text-ink">Wishlist</h1>
        {items.length === 0 ? <p className="mt-4 text-ink-soft">Save files from creator pages to see them here.</p> : (
          <ul className="mt-4 space-y-2">
            {items.map((i) => <li key={i.file_id} className="card-soft">{i.creator_files?.title ?? "File"}</li>)}
          </ul>
        )}
      </div>
    </div>
  );
}
