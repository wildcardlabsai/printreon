import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

function genCode() {
  return Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map((b) => b.toString(36).padStart(2, "0"))
    .join("")
    .slice(0, 12)
    .toUpperCase();
}

export const createGift = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        creatorId: z.string().uuid(),
        tierId: z.string().uuid(),
        recipientEmail: z.string().email(),
        months: z.number().int().min(1).max(12),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const code = genCode();
    const { error } = await supabaseAdmin.from("gift_subscriptions").insert({
      buyer_user_id: context.userId,
      creator_id: data.creatorId,
      tier_id: data.tierId,
      recipient_email: data.recipientEmail,
      months: data.months,
      redeem_code: code,
      status: "pending",
    });
    if (error) throw new Error(error.message);
    return { code };
  });

export const redeemGift = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ code: z.string().min(4) }).parse(d))
  .handler(async ({ data, context }) => {
    const code = data.code.trim().toUpperCase();
    const { data: gift } = await supabaseAdmin
      .from("gift_subscriptions")
      .select("*")
      .eq("redeem_code", code)
      .maybeSingle();
    if (!gift) throw new Error("Invalid code");
    if (gift.status === "redeemed") throw new Error("Code already redeemed");

    const periodStart = new Date();
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + gift.months);

    const { error: subErr } = await supabaseAdmin.from("subscriptions").insert({
      user_id: context.userId,
      creator_id: gift.creator_id,
      tier_id: gift.tier_id,
      status: "active",
      current_period_start: periodStart.toISOString(),
      current_period_end: periodEnd.toISOString(),
      cancel_at_period_end: true,
    });
    if (subErr) throw new Error(subErr.message);

    await supabaseAdmin
      .from("gift_subscriptions")
      .update({ status: "redeemed", redeemed_at: new Date().toISOString(), recipient_user_id: context.userId })
      .eq("id", gift.id);

    return { ok: true };
  });
