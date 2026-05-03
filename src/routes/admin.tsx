import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteChrome";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { adminSetPublished, adminGrantRole } from "@/server/admin.functions";
import { Shield, Users, FileBox, Flag, CheckCircle2, XCircle, Eye, EyeOff, Search, UserPlus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — MakerMind Club" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [creators, setCreators] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [waitlist, setWaitlist] = useState<any[]>([]);
  const [stats, setStats] = useState({ creators: 0, files: 0, members: 0, subs: 0 });
  const [q, setQ] = useState("");
  const [grantEmail, setGrantEmail] = useState("");
  const [grantRole, setGrantRole] = useState<"admin" | "creator" | "member">("creator");

  const setPublished = useServerFn(adminSetPublished);
  const grantRoleFn = useServerFn(adminGrantRole);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
    if (!loading && user && !isAdmin) navigate({ to: "/" });
  }, [user, loading, isAdmin, navigate]);

  const refresh = async () => {
    const [{ data: c }, { data: r }, { data: w }, { count: cCount }, { count: fCount }, { count: mCount }, { count: sCount }] = await Promise.all([
      supabase.from("creator_profiles").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("admin_reports").select("*").eq("status", "open").order("created_at", { ascending: false }),
      supabase.from("waitlist").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("creator_profiles").select("*", { count: "exact", head: true }),
      supabase.from("creator_files").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "active"),
    ]);
    setCreators(c ?? []); setReports(r ?? []); setWaitlist(w ?? []);
    setStats({ creators: cCount ?? 0, files: fCount ?? 0, members: mCount ?? 0, subs: sCount ?? 0 });
  };
  useEffect(() => { if (isAdmin) refresh(); }, [isAdmin]);

  const verify = async (cp: any, val: boolean) => {
    const { error } = await supabase.from("creator_profiles").update({ is_verified: val }).eq("id", cp.id);
    if (error) return toast.error(error.message);
    toast.success(val ? "Verified" : "Unverified");
    setCreators((cs) => cs.map((c) => c.id === cp.id ? { ...c, is_verified: val } : c));
  };

  const togglePublish = async (cp: any) => {
    try {
      await setPublished({ data: { creatorId: cp.id, isPublished: !cp.is_published } });
      setCreators((cs) => cs.map((c) => c.id === cp.id ? { ...c, is_published: !cp.is_published } : c));
      toast.success("Updated");
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
  };

  const closeReport = async (id: string) => {
    const { error } = await supabase.from("admin_reports").update({ status: "closed" }).eq("id", id);
    if (error) return toast.error(error.message);
    setReports((rs) => rs.filter((r) => r.id !== id));
  };

  const doGrant = async () => {
    try {
      await grantRoleFn({ data: { email: grantEmail.trim(), role: grantRole } });
      toast.success(`Granted ${grantRole} to ${grantEmail}`);
      setGrantEmail("");
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
  };

  const exportWaitlist = () => {
    const csv = ["email,role_interest,joined", ...waitlist.map((w) => `${w.email},${w.role_interest ?? ""},${w.created_at}`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "waitlist.csv"; a.click();
  };

  const filteredCreators = useMemo(
    () => q ? creators.filter((c) => `${c.display_name} ${c.slug}`.toLowerCase().includes(q.toLowerCase())) : creators,
    [creators, q]
  );

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-surface">
      <SiteHeader />
      <div className="container-page py-10">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold text-ink">Admin</h1>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <Stat label="Creators" value={stats.creators} icon={Users} />
          <Stat label="Members" value={stats.members} icon={Users} />
          <Stat label="Files" value={stats.files} icon={FileBox} />
          <Stat label="Active subs" value={stats.subs} icon={Shield} />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="card-soft lg:col-span-2">
            <h2 className="text-lg font-bold text-ink">Open reports ({reports.length})</h2>
            {reports.length === 0 ? (
              <p className="mt-2 text-sm text-ink-soft">No open reports.</p>
            ) : (
              <div className="mt-3 grid gap-3">
                {reports.map((r) => (
                  <div key={r.id} className="flex items-start justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                    <div>
                      <Flag className="mb-1 h-4 w-4 text-destructive" />
                      <p className="text-sm text-ink">{r.reason}</p>
                      <p className="text-xs text-ink-soft">{new Date(r.created_at).toLocaleString()}</p>
                    </div>
                    <button onClick={() => closeReport(r.id)} className="btn-ghost h-9">Close</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card-soft">
            <h2 className="text-lg font-bold text-ink">Grant role</h2>
            <p className="mt-1 text-xs text-ink-soft">Add a role to a registered user by email.</p>
            <input value={grantEmail} onChange={(e) => setGrantEmail(e.target.value)} placeholder="user@example.com" className="mt-3 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            <select value={grantRole} onChange={(e) => setGrantRole(e.target.value as any)} className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
              <option value="creator">creator</option>
              <option value="admin">admin</option>
              <option value="member">member</option>
            </select>
            <button onClick={doGrant} disabled={!grantEmail} className="btn-primary mt-3 w-full"><UserPlus className="mr-2 h-4 w-4" />Grant role</button>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-ink">Creators ({creators.length})</h2>
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search creators" className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm" />
          </div>
        </div>
        <div className="card-soft mt-3 overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-left text-xs uppercase text-ink-soft">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCreators.map((c) => (
                <tr key={c.id} className="border-t border-border">
                  <td className="px-4 py-3 font-semibold text-ink">{c.display_name} {c.is_verified && <CheckCircle2 className="inline h-4 w-4 text-primary" />}</td>
                  <td className="px-4 py-3"><Link to="/c/$slug" params={{ slug: c.slug }} className="text-primary hover:underline">/c/{c.slug}</Link></td>
                  <td className="px-4 py-3">{c.is_published ? "Published" : "Draft"}</td>
                  <td className="px-4 py-3 text-ink-soft">{new Date(c.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => togglePublish(c)} className="btn-ghost h-8 px-3 text-xs" title={c.is_published ? "Unpublish" : "Publish"}>
                        {c.is_published ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </button>
                      {c.is_verified ? (
                        <button onClick={() => verify(c, false)} className="btn-ghost h-8 px-3 text-xs"><XCircle className="mr-1 h-3 w-3" />Unverify</button>
                      ) : (
                        <button onClick={() => verify(c, true)} className="btn-ghost h-8 px-3 text-xs"><CheckCircle2 className="mr-1 h-3 w-3" />Verify</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-10 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">Waitlist ({waitlist.length})</h2>
          <button onClick={exportWaitlist} className="btn-ghost h-9 px-3 text-sm">Export CSV</button>
        </div>
        <div className="card-soft mt-3 max-h-80 overflow-y-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-left text-xs uppercase text-ink-soft">
              <tr><th className="px-4 py-3">Email</th><th className="px-4 py-3">Interest</th><th className="px-4 py-3">Joined</th></tr>
            </thead>
            <tbody>
              {waitlist.map((w) => (
                <tr key={w.id} className="border-t border-border">
                  <td className="px-4 py-3">{w.email}</td>
                  <td className="px-4 py-3 capitalize">{w.role_interest ?? "—"}</td>
                  <td className="px-4 py-3 text-ink-soft">{new Date(w.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: number; icon: any }) {
  return (
    <div className="card-soft">
      <Icon className="h-5 w-5 text-primary" />
      <div className="mt-2 text-xs font-semibold uppercase text-ink-soft">{label}</div>
      <div className="mt-1 text-3xl font-bold text-ink">{value}</div>
    </div>
  );
}
