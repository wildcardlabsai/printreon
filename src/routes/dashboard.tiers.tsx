import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCreatorProfile } from "@/lib/use-creator-profile";
import { Plus, Trash2, Layers, Save } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/tiers")({
  component: TiersPage,
});

function TiersPage() {
  const { creator } = useCreatorProfile();
  const [tiers, setTiers] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("5");
  const [benefits, setBenefits] = useState("");

  const refresh = async () => {
    if (!creator) return;
    const { data } = await supabase.from("creator_tiers").select("*").eq("creator_id", creator.id).order("price");
    setTiers(data ?? []);
  };
  useEffect(() => { refresh(); }, [creator]);

  const create = async () => {
    if (!creator || !name) return;
    const { error } = await supabase.from("creator_tiers").insert({
      creator_id: creator.id,
      name,
      price: Number(price),
      currency: "USD",
      benefits: benefits.split("\n").map((s) => s.trim()).filter(Boolean),
      sort_order: tiers.length,
    });
    if (error) return toast.error(error.message);
    toast.success("Tier created");
    setName(""); setPrice("5"); setBenefits("");
    refresh();
  };

  const update = async (t: any, patch: any) => {
    const { error } = await supabase.from("creator_tiers").update(patch).eq("id", t.id);
    if (error) return toast.error(error.message);
    refresh();
  };

  const remove = async (t: any) => {
    if (!confirm(`Delete tier "${t.name}"?`)) return;
    const { error } = await supabase.from("creator_tiers").delete().eq("id", t.id);
    if (error) return toast.error(error.message);
    refresh();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="card-soft">
        <h2 className="text-lg font-bold text-ink">Add a tier</h2>
        <p className="mt-1 text-sm text-ink-soft">Subscribers picking a higher-priced tier automatically unlock everything below.</p>
        <div className="mt-4 space-y-3">
          <Field label="Name"><input value={name} onChange={(e) => setName(e.target.value)} className={inp} placeholder="Standard Files" /></Field>
          <Field label="Monthly price (USD)"><input type="number" min="1" value={price} onChange={(e) => setPrice(e.target.value)} className={inp} /></Field>
          <Field label="Benefits (one per line)"><textarea value={benefits} onChange={(e) => setBenefits(e.target.value)} rows={5} className={inp} /></Field>
          <button onClick={create} className="btn-primary w-full"><Plus className="mr-2 h-4 w-4" />Create tier</button>
        </div>
      </div>

      <div className="lg:col-span-2">
        <h2 className="text-lg font-bold text-ink">Your tiers ({tiers.length})</h2>
        {tiers.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="No tiers yet"
            description="Tiers let members subscribe at different price points. Start with one — you can add more later (e.g. Standard, Patron, Studio)."
          />
        ) : (
          <div className="mt-3 grid gap-3">
            {tiers.map((t) => (
              <TierEditor key={t.id} tier={t} onUpdate={update} onDelete={remove} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TierEditor({ tier, onUpdate, onDelete }: { tier: any; onUpdate: (t: any, p: any) => void; onDelete: (t: any) => void }) {
  const [name, setName] = useState(tier.name);
  const [price, setPrice] = useState(String(tier.price));
  const [benefits, setBenefits] = useState((tier.benefits ?? []).join("\n"));
  const [active, setActive] = useState(tier.is_active);

  return (
    <div className="card-soft">
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Name"><input value={name} onChange={(e) => setName(e.target.value)} className={inp} /></Field>
        <Field label="Price"><input type="number" min="1" value={price} onChange={(e) => setPrice(e.target.value)} className={inp} /></Field>
      </div>
      <Field label="Benefits"><textarea value={benefits} onChange={(e) => setBenefits(e.target.value)} rows={4} className={inp} /></Field>
      <label className="mt-3 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Active and visible on profile
      </label>
      <div className="mt-3 flex justify-between">
        <button
          onClick={() =>
            onUpdate(tier, {
              name,
              price: Number(price),
              benefits: benefits.split("\n").map((s: string) => s.trim()).filter(Boolean),
              is_active: active,
            })
          }
          className="btn-primary h-9"
        >
          <Save className="mr-2 h-4 w-4" /> Save
        </button>
        <button onClick={() => onDelete(tier)} className="btn-ghost h-9 text-destructive hover:bg-destructive/10">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

const inp = "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-ink">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
