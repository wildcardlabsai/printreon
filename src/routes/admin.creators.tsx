import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState, StatusBadge } from "@/components/admin/AdminUI";
import { useServerFn } from "@tanstack/react-start";
import { adminSetPublished } from "@/functions/admin.functions";
import { toast } from "sonner";
import { Search } from "lucide-react";

export const Route = createFileRoute("/admin/creators")({ component: Creators });

function Creators() {
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const setPublished = useServerFn(adminSetPublished);

  const refresh = async () => {
    const { data } = await supabase.from("creator_profiles").select("id, user_id, display_name, slug, bio, short_intro, profile_image_url, banner_image_url, website_url, instagram_url, tiktok_url, youtube_url, cults_url, printables_url, makerworld_url, is_verified, is_published, platform_fee_percentage, suspended_at, suspension_reason, created_at, updated_at").order("created_at", { ascending: false }).limit(500);
    setRows(data ?? []);
  };
  useEffect(() => { refresh(); }, []);

  const filtered = useMemo(() => rows.filter((r) => !q || `${r.display_name} ${r.slug}`.toLowerCase().includes(q.toLowerCase())), [rows, q]);

  const toggle = async (cp: any) => {
    try {
      await setPublished({ data: { creatorId: cp.id, isPublished: !cp.is_published } });
      await supabase.from("admin_activity_log").insert({ action: cp.is_published ? "creator.unpublished" : "creator.published", target_type: "creator_profile", target_id: cp.id });
      refresh();
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
  };

  const verify = async (cp: any, val: boolean) => {
    await supabase.from("creator_profiles").update({ is_verified: val }).eq("id", cp.id);
    await supabase.from("admin_activity_log").insert({ action: val ? "creator.verified" : "creator.unverified", target_type: "creator_profile", target_id: cp.id });
    refresh();
  };

  return (
    <div className="p-8">
      <PageHeader title="Creators" subtitle={`${rows.length} creator profiles`} />
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search creators" className="pl-9 pr-3 py-2 text-sm rounded-lg border border-input bg-background w-full" />
      </div>
      {filtered.length === 0 ? (
        <EmptyState title="No creators found." />
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-left text-xs uppercase text-ink-soft">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Slug</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Verified</th>
                <th className="px-3 py-2">Joined</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-t border-border">
                  <td className="px-3 py-2 font-semibold">{c.display_name}</td>
                  <td className="px-3 py-2"><Link to="/c/$slug" params={{ slug: c.slug }} className="text-primary hover:underline">/c/{c.slug}</Link></td>
                  <td className="px-3 py-2"><StatusBadge status={c.is_published ? "published" : "draft"} /></td>
                  <td className="px-3 py-2">{c.is_verified ? "✓" : "—"}</td>
                  <td className="px-3 py-2 text-xs text-ink-soft">{new Date(c.created_at).toLocaleDateString()}</td>
                  <td className="px-3 py-2 text-right space-x-1">
                    <button onClick={() => toggle(c)} className="btn-ghost h-7 text-xs">{c.is_published ? "Unpublish" : "Publish"}</button>
                    <button onClick={() => verify(c, !c.is_verified)} className="btn-ghost h-7 text-xs">{c.is_verified ? "Unverify" : "Verify"}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
