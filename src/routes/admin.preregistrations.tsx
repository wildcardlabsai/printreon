import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, StatusBadge, EmptyState, exportCsv } from "@/components/admin/AdminUI";
import { Search, Mail, Tag, X, Copy } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { adminSendBetaInvite } from "@/functions/inbox.functions";

export const Route = createFileRoute("/admin/preregistrations")({ component: Preregs });

const STATUSES = ["pending", "shortlisted", "invited", "accepted", "rejected", "waitlist"];

function Preregs() {
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [drawer, setDrawer] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const sendBetaInvite = useServerFn(adminSendBetaInvite);

  const refresh = async () => {
    setLoading(true);
    const { data } = await supabase.from("beta_preregistrations").select("*").order("created_at", { ascending: false }).limit(1000);
    setRows(data ?? []);
    setLoading(false);
  };
  useEffect(() => { refresh(); }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (q) {
        const hay = `${r.email} ${r.full_name ?? ""} ${r.creator_name ?? ""}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [rows, q, statusFilter]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("beta_preregistrations").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    await supabase.from("admin_activity_log").insert({ action: `prereg.${status}`, target_type: "beta_preregistration", target_id: id });
    setRows((rs) => rs.map((r) => r.id === id ? { ...r, status } : r));
    if (drawer?.id === id) setDrawer({ ...drawer, status });
    toast.success(`Marked ${status}`);
  };

  const saveNote = async (id: string, notes: string) => {
    await supabase.from("beta_preregistrations").update({ notes }).eq("id", id);
    setRows((rs) => rs.map((r) => r.id === id ? { ...r, notes } : r));
    toast.success("Note saved");
  };

  const bulk = async (status: string) => {
    const ids = Object.keys(selected).filter((k) => selected[k]);
    if (!ids.length) return;
    await supabase.from("beta_preregistrations").update({ status }).in("id", ids);
    await supabase.from("admin_activity_log").insert({ action: `prereg.bulk_${status}`, target_type: "beta_preregistration", metadata: { ids } });
    setSelected({});
    refresh();
    toast.success(`${ids.length} updated`);
  };

  const sendInvite = async (r: any) => {
    if (r.status === "invited" && !window.confirm(`${r.email} was already invited. Send another invite with a new code?`)) return;
    setSending(r.id);
    try {
      const res: any = await sendBetaInvite({
        data: { email: r.email, name: r.creator_name || r.full_name || "", applicationId: r.id },
      });
      if (res?.sent) toast.success(`Invite emailed to ${r.email}`);
      else if (res?.reason === "recipient_suppressed") toast.warning("Not sent: that address has unsubscribed or previously bounced.");
      else toast.warning("Invite created, but the email did not send.");
      if (drawer?.id === r.id) setDrawer({ ...drawer, status: "invited", invite_code: res?.inviteCode ?? drawer.invite_code });
      refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to send invite");
    } finally {
      setSending(null);
    }
  };

  const copyInviteLink = async (r: any) => {
    if (!r.invite_code) return toast.error("No invite code yet. Send an invite first.");
    await navigator.clipboard.writeText(`${window.location.origin}/join?invite=${r.invite_code}`).catch(() => {});
    toast.success("Invite link copied");
  };

  const bulkInvite = async () => {
    const ids = Object.keys(selected).filter((k) => selected[k]);
    const targets = rows.filter((r) => ids.includes(r.id));
    if (!targets.length) return;
    if (!window.confirm(`Send invite emails to ${targets.length} applicant(s)?`)) return;
    let ok = 0;
    for (const t of targets) {
      try {
        const res: any = await sendBetaInvite({
          data: { email: t.email, name: t.creator_name || t.full_name || "", applicationId: t.id },
        });
        if (res?.sent) ok += 1;
      } catch {
        /* keep going through the rest of the list */
      }
    }
    setSelected({});
    refresh();
    toast.success(`${ok} of ${targets.length} invites sent`);
  };

  return (
    <div className="p-8">
      <PageHeader
        title="Preregistrations"
        subtitle={`${rows.length} total applicants`}
        actions={
          <>
            <button onClick={() => exportCsv("preregistrations.csv", filtered)} className="btn-ghost h-9 px-3 text-sm">Export CSV</button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search email / name" className="pl-9 pr-3 py-2 text-sm rounded-lg border border-input bg-background w-72" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
          <option value="all">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {Object.values(selected).some(Boolean) && (
          <div className="ml-auto flex gap-2">
            <button onClick={bulkInvite} className="btn-primary h-9 text-xs">Send invites</button>
            <button onClick={() => bulk("shortlisted")} className="btn-ghost h-9 text-xs">Shortlist</button>
            <button onClick={() => bulk("waitlist")} className="btn-ghost h-9 text-xs">Waitlist</button>
            <button onClick={() => bulk("rejected")} className="btn-ghost h-9 text-xs">Reject</button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-ink-soft">Loading…</div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No preregistrations yet." description="When applicants submit the beta form, they'll appear here." />
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-left text-xs uppercase text-ink-soft">
              <tr>
                <th className="px-3 py-2 w-8"></th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Platform</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Joined</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t border-border hover:bg-secondary/40">
                  <td className="px-3 py-2"><input type="checkbox" checked={!!selected[r.id]} onChange={(e) => setSelected({ ...selected, [r.id]: e.target.checked })} /></td>
                  <td className="px-3 py-2 font-mono text-xs">{r.email}</td>
                  <td className="px-3 py-2">{r.creator_name || r.full_name || "—"}</td>
                  <td className="px-3 py-2 text-ink-soft">{r.current_platform || "—"}</td>
                  <td className="px-3 py-2"><StatusBadge status={r.status} /></td>
                  <td className="px-3 py-2 text-ink-soft text-xs">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => sendInvite(r)} disabled={sending === r.id} className="btn-ghost h-7 text-xs disabled:opacity-50">
                      {sending === r.id ? "Sending…" : r.status === "invited" ? "Resend invite" : "Send invite"}
                    </button>
                    <button onClick={() => setDrawer(r)} className="btn-ghost h-7 text-xs">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {drawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={() => setDrawer(null)}>
          <div className="w-full max-w-lg bg-card border-l border-border h-full overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold">{drawer.creator_name || drawer.full_name || "Applicant"}</h2>
                <p className="text-sm text-ink-soft">{drawer.email}</p>
              </div>
              <button onClick={() => setDrawer(null)}><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3 text-sm">
              <div><span className="text-ink-soft">Status:</span> <StatusBadge status={drawer.status} /></div>
              <div><span className="text-ink-soft">Current platform:</span> {drawer.current_platform || "—"}</div>
              <div><span className="text-ink-soft">Audience:</span> {drawer.audience_size || "—"}</div>
              <div><span className="text-ink-soft">Website:</span> {drawer.website_url ? <a className="text-primary" href={drawer.website_url} target="_blank" rel="noreferrer">{drawer.website_url}</a> : "—"}</div>
              <div><span className="text-ink-soft">Social:</span> {drawer.social_url ? <a className="text-primary" href={drawer.social_url} target="_blank" rel="noreferrer">{drawer.social_url}</a> : "—"}</div>
              <div className="flex gap-3 text-xs">
                <span>STLs: {drawer.sells_stls ? "✓" : "—"}</span>
                <span>Prints: {drawer.sells_physical_prints ? "✓" : "—"}</span>
                <span>Commercial: {drawer.interested_in_commercial_licensing ? "✓" : "—"}</span>
              </div>
              <div>
                <div className="text-ink-soft mb-1">Reason for joining</div>
                <p className="rounded bg-secondary p-2 text-xs whitespace-pre-wrap">{drawer.reason_for_joining || "—"}</p>
              </div>
              <div>
                <div className="text-ink-soft mb-1">Internal notes</div>
                <textarea defaultValue={drawer.notes ?? ""} onBlur={(e) => saveNote(drawer.id, e.target.value)} rows={4} className="w-full rounded border border-input bg-background p-2 text-xs" />
              </div>
              {drawer.invite_code && <div className="text-xs"><Tag className="inline h-3 w-3 mr-1" />Invite code: <span className="font-mono">{drawer.invite_code}</span></div>}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2">
              <button onClick={() => sendInvite(drawer)} disabled={sending === drawer.id} className="btn-primary disabled:opacity-50">
                <Mail className="h-4 w-4 mr-1" />{sending === drawer.id ? "Sending…" : drawer.status === "invited" ? "Resend invite" : "Send invite"}
              </button>
              <button onClick={() => copyInviteLink(drawer)} className="btn-ghost"><Copy className="h-4 w-4 mr-1" />Copy link</button>
              <button onClick={() => updateStatus(drawer.id, "shortlisted")} className="btn-ghost">Shortlist</button>
              <button onClick={() => updateStatus(drawer.id, "waitlist")} className="btn-ghost">Waitlist</button>
              <button onClick={() => updateStatus(drawer.id, "rejected")} className="btn-ghost text-destructive">Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
