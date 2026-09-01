import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useDiscoveryEnabled } from "@/lib/use-discovery";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Compass, Heart } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/me/following")({
  component: FollowingPage,
});

function FollowingPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[] | null>(null);

  const refresh = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("followers")
      .select("id, created_at, creator_profiles:creator_id(id, display_name, slug, profile_image_url, short_intro)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setItems(data ?? []);
  };
  useEffect(() => { refresh(); }, [user]);

  const unfollow = async (id: string) => {
    const { error } = await supabase.from("followers").delete().eq("id", id);
    if (error) return toast.error(error.message);
    refresh();
  };

  if (items === null) return <div className="card-soft h-32 animate-pulse" />;
  if (items.length === 0) {
    return (
      <div className="card-soft text-center">
        <Compass className="mx-auto h-10 w-10 text-primary" />
        <h3 className="mt-3 text-xl font-bold text-ink">Not following anyone yet</h3>
        {discoveryEnabled ? (
          <Link to="/explore" className="btn-primary mt-5 inline-flex">Discover creators</Link>
        ) : (
          <Link to="/explore" className="btn-primary mt-5 inline-flex">Creators coming soon — join the waitlist</Link>
        )}
      </div>
    );
  }
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((f) => {
        const cp = f.creator_profiles;
        if (!cp) return null;
        return (
          <div key={f.id} className="card-soft">
            <div className="flex items-center gap-3">
              {cp.profile_image_url ? (
                <img src={cp.profile_image_url} className="h-12 w-12 rounded-full object-cover" alt="" />
              ) : (
                <div className="h-12 w-12 rounded-full bg-accent text-primary flex items-center justify-center font-bold">{cp.display_name[0]}</div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-ink truncate">{cp.display_name}</div>
                {cp.short_intro && <div className="text-xs text-ink-soft truncate">{cp.short_intro}</div>}
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Link to="/c/$slug" params={{ slug: cp.slug }} className="btn-ghost h-9 px-3 text-sm flex-1">View</Link>
              <button onClick={() => unfollow(f.id)} className="btn-ghost h-9 px-3 text-sm" title="Unfollow"><Heart className="h-4 w-4 fill-current text-primary" /></button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
