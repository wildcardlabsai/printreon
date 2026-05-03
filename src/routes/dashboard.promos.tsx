import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCreatorProfile } from "@/lib/use-creator-profile";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/promos")({
  head: () => ({ meta: [{ title: "Promo codes — Creator Studio" }] }),
  component: PromosPage,
});

function PromosPage() {
  const { creator } = useCreatorProfile();
  const [codes, setCodes] = useState<any[]>([]);
  const [form, setForm] = useState({ code: "", percent_off: 20, max_uses: "" as string | "" });

  const load = async () => {
    if (!creator) return;
    const { data } = await supabase.from("promo_codes").select("*").eq("creator_id", creator.id).order("created_at", { ascending: false });
    setCodes(data ?? []);
  };
  useEffect(() => { load(); }, [creator]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creator) return;
    const { error } = await supabase.from("promo_codes").insert({
      creator_id: creator.id,
      code: form.code.toUpperCase(),
      percent_off: form.percent_off,
      max_uses: form.max_uses ? Number(form.max_uses) : null,
    });
    if (error) return toast.error(error.message);
    setForm({ code: "", percent_off: 20, max_uses: "" });
    load();
  };

  if (!creator) return null;
  return (
    <div>
      <h2 className="text-xl font-bold text-ink">Promo codes</h2>
      <form onSubmit={submit} className="card-soft mt-4 grid gap-3 md:grid-cols-4">
        <input required placeholder="CODE" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="rounded-md border border-border bg-background p-2" />
        <input type="number" required value={form.percent_off} onChange={(e) => setForm({ ...form, percent_off: +e.target.value })} className="rounded-md border border-border bg-background p-2" />
        <input type="number" placeholder="Max uses (optional)" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })} className="rounded-md border border-border bg-background p-2" />
        <button className="btn-primary">Create</button>
      </form>
      <div className="mt-6 space-y-2">
        {codes.map((c) => (
          <div key={c.id} className="card-soft flex items-center justify-between">
            <div><p className="font-mono font-bold text-ink">{c.code}</p><p className="text-xs text-ink-soft">{c.percent_off}% off · {c.uses_count}/{c.max_uses ?? "∞"} used</p></div>
            <span className={`text-xs ${c.is_active ? "text-primary" : "text-ink-soft"}`}>{c.is_active ? "Active" : "Inactive"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
