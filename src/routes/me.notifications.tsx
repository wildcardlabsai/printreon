import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteChrome";
import { MemberNav } from "@/components/MemberNav";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/me/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Printreon" }] }),
  component: NotifPage,
});

function NotifPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [prefs, setPrefs] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100).then(({ data }) => setItems(data ?? []));
    supabase.from("notification_prefs").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => setPrefs(data ?? { user_id: user.id, email_new_file: true, email_new_post: true, email_dm: true, email_weekly_digest: true }));
  }, [user]);

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", user.id).is("read_at", null);
    const { data } = await supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setItems(data ?? []);
  };

  const savePrefs = async () => {
    if (!user || !prefs) return;
    await supabase.from("notification_prefs").upsert({ ...prefs, user_id: user.id });
  };

  return (
    <div className="min-h-screen bg-surface">
      <SiteHeader />
      <div className="container-page py-8">
        <MemberNav />
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-ink">Notifications</h1>
          <button onClick={markAllRead} className="btn-ghost text-sm">Mark all read</button>
        </div>
        <ul className="mt-4 space-y-2">
          {items.length === 0 ? <p className="text-ink-soft">All caught up.</p> :
            items.map((n) => (
              <li key={n.id} className={`card-soft ${n.read_at ? "opacity-60" : ""}`}>
                <p className="font-semibold text-ink">{n.title}</p>
                {n.body && <p className="text-sm text-ink-soft">{n.body}</p>}
                <p className="mt-1 text-xs text-ink-soft">{new Date(n.created_at).toLocaleString()}</p>
              </li>
            ))}
        </ul>
        {prefs && (
          <div className="card-soft mt-8">
            <h2 className="text-lg font-bold text-ink">Email preferences</h2>
            <div className="mt-3 space-y-2 text-sm">
              {[
                ["email_new_file", "New file from creators I follow"],
                ["email_new_post", "New posts"],
                ["email_dm", "Direct messages"],
                ["email_weekly_digest", "Weekly digest"],
              ].map(([k, label]) => (
                <label key={k} className="flex items-center gap-2 text-ink">
                  <input type="checkbox" checked={prefs[k]} onChange={(e) => setPrefs({ ...prefs, [k]: e.target.checked })} />
                  {label}
                </label>
              ))}
              <button onClick={savePrefs} className="btn-primary mt-3">Save</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
