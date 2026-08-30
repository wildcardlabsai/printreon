import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState, exportCsv } from "@/components/admin/AdminUI";
import { Search } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { adminGrantRole } from "@/functions/admin.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/users")({ component: Users });

function Users() {
  const [rows, setRows] = useState<any[]>([]);
  const [roles, setRoles] = useState<Record<string, string[]>>({});
  const [q, setQ] = useState("");
  const grant = useServerFn(adminGrantRole);

  const refresh = async () => {
    const { data: profs } = await supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(1000);
    setRows(profs ?? []);
    const { data: rs } = await supabase.from("user_roles").select("user_id, role");
    const map: Record<string, string[]> = {};
    (rs ?? []).forEach((r: any) => { (map[r.user_id] ||= []).push(r.role); });
    setRoles(map);
  };
  useEffect(() => { refresh(); }, []);

  const filtered = useMemo(() => rows.filter((r) => !q || `${r.email} ${r.full_name ?? ""} ${r.username ?? ""}`.toLowerCase().includes(q.toLowerCase())), [rows, q]);

  const makeCreator = async (email: string) => {
    try { await grant({ data: { email, role: "creator" } }); toast.success("Granted creator"); refresh(); }
    catch (e: any) { toast.error(e?.message ?? "Failed"); }
  };

  return (
    <div className="p-8">
      <PageHeader title="Users" subtitle={`${rows.length} total users`} actions={
        <button onClick={() => exportCsv("users.csv", filtered)} className="btn-ghost h-9 px-3 text-sm">Export CSV</button>
      } />
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search email / name" className="pl-9 pr-3 py-2 text-sm rounded-lg border border-input bg-background w-full" />
      </div>
      {filtered.length === 0 ? (
        <EmptyState title="No users found." />
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-left text-xs uppercase text-ink-soft">
              <tr>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Roles</th>
                <th className="px-3 py-2">Joined</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.user_id} className="border-t border-border">
                  <td className="px-3 py-2 font-mono text-xs">{u.email}</td>
                  <td className="px-3 py-2">{u.full_name || u.username || "—"}</td>
                  <td className="px-3 py-2 text-xs">{(roles[u.user_id] ?? ["member"]).join(", ")}</td>
                  <td className="px-3 py-2 text-xs text-ink-soft">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-3 py-2 text-right">
                    {!(roles[u.user_id] ?? []).includes("creator") && u.email && (
                      <button onClick={() => makeCreator(u.email)} className="btn-ghost h-7 text-xs">Make creator</button>
                    )}
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
