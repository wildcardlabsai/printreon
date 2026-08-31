import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface IssuedLicence {
  subscriptionId: string;
  tierId: string;
  tierName: string;
  memberName: string;
  memberEmail: string;
  status: string;
  activeSince: string | null;
  endsAt: string | null;
  cancelAtPeriodEnd: boolean;
}

/**
 * Lists supporters currently holding a commercial licence through one of the
 * calling creator's commercial tiers. Runs server-side so supporter emails are
 * never exposed through the Data API to other members.
 */
export const listIssuedLicences = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<IssuedLicence[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Only the caller's own creator profile.
    const { data: creator } = await supabaseAdmin
      .from("creator_profiles")
      .select("id")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!creator) return [];

    const { data: tiers } = await supabaseAdmin
      .from("creator_tiers")
      .select("id, name")
      .eq("creator_id", creator.id)
      .eq("commercial_licence", true);

    const tierMap = new Map((tiers ?? []).map((t) => [t.id, t.name]));
    if (tierMap.size === 0) return [];

    const { data: subs } = await supabaseAdmin
      .from("subscriptions")
      .select("id, user_id, tier_id, status, created_at, current_period_end, cancel_at_period_end")
      .eq("creator_id", creator.id)
      .in("tier_id", Array.from(tierMap.keys()))
      .in("status", ["active", "trialing"])
      .order("created_at", { ascending: false });

    const userIds = Array.from(new Set((subs ?? []).map((s) => s.user_id)));
    const { data: profiles } = userIds.length
      ? await supabaseAdmin
          .from("profiles")
          .select("user_id, full_name, email")
          .in("user_id", userIds)
      : { data: [] as any[] };
    const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));

    return (subs ?? []).map((s) => {
      const p = profileMap.get(s.user_id);
      return {
        subscriptionId: s.id,
        tierId: s.tier_id,
        tierName: tierMap.get(s.tier_id) ?? "Tier",
        memberName: p?.full_name ?? "Member",
        memberEmail: p?.email ?? "",
        status: s.status,
        activeSince: s.created_at,
        endsAt: s.current_period_end,
        cancelAtPeriodEnd: !!s.cancel_at_period_end,
      };
    });
  });
