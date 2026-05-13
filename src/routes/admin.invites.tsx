import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, StatusBadge, EmptyState } from "@/components/admin/AdminUI";
import { Copy, Plus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/admin/invites")({ component: Invites });

function Invites() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [email, setEmail] = useState("");
  const [maxUses, setMaxUses] = useState(1);
  const [days, setDays] = useState(30);

  const refresh = async () => {
    const { data } = await supabase.from("invite_codes").select("*").order("created_at", { ascending: false }).limit(500);
    setRows(data ?? []);
  };
  useEffect(() => { refresh(); }, []);

  const create = async () => {
    const code = Math.random().toString(36).slice(2, 10).toUpperCase();
    const expires = days > 0 ? new Date(Date.now() + days * 86400000).toISOString() : null;
    const { error } = await supabase.from("invite_codes").insert({
      code, email: email || null, created_by: user?.id, max_uses: maxUses, status: "active", expires_at: expires,
    });
    if (error) return toast.error(error.message);
    await supabase.from("admin_activity_log").insert({ action: "invite.created", target_type: "invite_code", metadata: { code, email } });
    setEmail("");
    refresh();
    toast.success(`Invite ${code} created`);
  };

  const revoke = async (id: string) => {
    await supabase.from("invite_codes").update({ status: "revoked" }).eq("id", id);
    await supabase.from("admin_activity_log").insert({ action: "invite.revoked", target_type: "invite_code", target_id: id });
    refresh();
  };

  const copyLink = (code: string) => {
    const link = `${window.location.origin}/join?invite=${code}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copied");
  };

  return (
    <div className="p-8">
      <PageHeader title="Invites" subtitle="Create and manage beta invite codes." />

      <div className="rounded-lg border border-border bg-card p-4 mb-6">
        <h3 className="font-semibold mb-3 flex items-center gap-2"><Plus className="h-4 w-4" />Create invite</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email (optional)" className="rounded border border-input bg-background px-3 py-2 text-sm" />
          <input type="number" value={maxUses} onChange={(e) => setMaxUses(Number(e.target.value))} placeholder="Max uses" className="rounded border border-input bg-background px-3 py-2 text-sm" />
          <input type="number" value={days} onChange={(e) => setDays(Number(e.target.value))} placeholder="Expires (days)" className="rounded border border-input bg-background px-3 py-2 text-sm" />
          <button onClick={create} className="btn-primary">Generate</button>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No invites have been sent." description="Generate one above or invite from a preregistration." />
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-left text-xs uppercase text-ink-soft">
              <tr>
                <th className="px-3 py-2">Code</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Uses</th>
                <th className="px-3 py-2">Expires</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-3 py-2 font-mono">{r.code}</td>
                  <td className="px-3 py-2 text-xs">{r.email || "—"}</td>
                  <td className="px-3 py-2">{r.uses}/{r.max_uses}</td>
                  <td className="px-3 py-2 text-xs">{r.expires_at ? new Date(r.expires_at).toLocaleDateString() : "—"}</td>
                  <td className="px-3 py-2"><StatusBadge status={r.status} /></td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => copyLink(r.code)} className="btn-ghost h-7 text-xs"><Copy className="h-3 w-3" /></button>
                    {r.status === "active" && <button onClick={() => revoke(r.id)} className="btn-ghost h-7 text-xs text-destructive ml-1">Revoke</button>}
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
