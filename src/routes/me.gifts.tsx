import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { createGift, redeemGift } from "@/functions/gifts.functions";
import { toast } from "sonner";
import { Gift, Copy } from "lucide-react";

export const Route = createFileRoute("/me/gifts")({
  component: GiftsPage,
});

function GiftsPage() {
  const { user } = useAuth();
  const [creators, setCreators] = useState<any[]>([]);
  const [tiers, setTiers] = useState<any[]>([]);
  const [creatorId, setCreatorId] = useState("");
  const [tierId, setTierId] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [months, setMonths] = useState(1);
  const [code, setCode] = useState<string | null>(null);
  const [redeemCode, setRedeemCode] = useState("");
  const [myGifts, setMyGifts] = useState<any[]>([]);

  const create = useServerFn(createGift);
  const redeem = useServerFn(redeemGift);

  useEffect(() => {
    supabase
      .from("creator_profiles")
      .select("id, display_name, slug")
      .eq("is_published", true)
      .order("display_name")
      .then(({ data }) => setCreators(data ?? []));
  }, []);

  useEffect(() => {
    if (!creatorId) { setTiers([]); setTierId(""); return; }
    supabase
      .from("creator_tiers")
      .select("id, name, price")
      .eq("creator_id", creatorId)
      .eq("is_active", true)
      .then(({ data }) => setTiers(data ?? []));
  }, [creatorId]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("gift_subscriptions")
      .select("*")
      .or(`buyer_user_id.eq.${user.id},recipient_user_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .then(({ data }) => setMyGifts(data ?? []));
  }, [user, code]);

  const submit = async () => {
    if (!creatorId || !tierId || !recipientEmail) return toast.error("Fill all fields");
    try {
      const r = await create({ data: { creatorId, tierId, recipientEmail, months } });
      setCode(r.code);
      toast.success("Gift created");
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
  };

  const submitRedeem = async () => {
    if (!redeemCode) return;
    try {
      await redeem({ data: { code: redeemCode } });
      toast.success("Gift redeemed! Subscription active.");
      setRedeemCode("");
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="card-soft">
        <div className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold text-ink">Send a gift subscription</h2>
        </div>
        <div className="mt-4 grid gap-3">
          <select value={creatorId} onChange={(e) => setCreatorId(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
            <option value="">Choose creator</option>
            {creators.map((c) => <option key={c.id} value={c.id}>{c.display_name}</option>)}
          </select>
          <select value={tierId} onChange={(e) => setTierId(e.target.value)} disabled={!tiers.length} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
            <option value="">Choose tier</option>
            {tiers.map((t) => <option key={t.id} value={t.id}>{t.name} — ${Number(t.price).toFixed(0)}/mo</option>)}
          </select>
          <input type="email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} placeholder="Recipient email" className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
          <label className="text-xs text-ink-soft">Months
            <input type="number" min={1} max={12} value={months} onChange={(e) => setMonths(parseInt(e.target.value || "1"))} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
          </label>
          <button onClick={submit} className="btn-primary">Generate gift code</button>
        </div>
        {code && (
          <div className="mt-4 rounded-lg border border-border bg-secondary p-3">
            <p className="text-xs font-semibold uppercase text-ink-soft">Share this code with the recipient</p>
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 rounded bg-background px-3 py-2 font-mono text-lg text-ink">{code}</code>
              <button onClick={() => navigator.clipboard.writeText(code)} className="btn-ghost h-9"><Copy className="h-4 w-4" /></button>
            </div>
          </div>
        )}
      </div>

      <div className="card-soft">
        <h2 className="text-lg font-bold text-ink">Redeem a gift code</h2>
        <p className="mt-1 text-sm text-ink-soft">Got a code from a friend? Activate your free months here.</p>
        <input value={redeemCode} onChange={(e) => setRedeemCode(e.target.value.toUpperCase())} placeholder="GIFT-CODE" className="mt-4 w-full rounded-lg border border-input bg-background px-3 py-2 font-mono text-sm" />
        <button onClick={submitRedeem} className="btn-primary mt-3 w-full">Redeem</button>

        <h3 className="mt-6 text-sm font-bold text-ink">Your gifts</h3>
        {myGifts.length === 0 ? <p className="mt-2 text-xs text-ink-soft">None yet.</p> : (
          <div className="mt-2 space-y-2">
            {myGifts.map((g) => (
              <div key={g.id} className="flex items-center justify-between rounded-lg border border-border p-2 text-xs">
                <div>
                  <p className="font-mono">{g.redeem_code}</p>
                  <p className="text-ink-soft">{g.months}mo · {g.status}</p>
                </div>
                <span className="text-ink-soft">{g.recipient_email}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
