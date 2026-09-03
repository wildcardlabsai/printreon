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
  licenceNumber: string | null;
  issuedAt: string | null;
}

export interface MemberLicence {
  id: string;
  licenceNumber: string;
  status: string;
  creatorId: string;
  creatorName: string;
  creatorSlug: string | null;
  tierName: string;
  issuedAt: string;
  revokedAt: string | null;
  endsAt: string | null;
  cancelAtPeriodEnd: boolean;
  terms: {
    summary?: string | null;
    terms?: string | null;
    unitsLimit?: number | null;
    attributionRequired?: boolean | null;
    price?: number | null;
    currency?: string | null;
    interval?: string | null;
  };
}

const ACTIVE = ["active", "trialing"];

/**
 * Issues licence records for every active commercial subscription in scope and
 * revokes the ones whose subscription is no longer active. Terms are snapshotted
 * at issue time so a later tier edit cannot rewrite an existing licence.
 */
async function syncLicences(admin: any, filter: { creatorId?: string; userId?: string }) {
  let subQuery = admin
    .from("subscriptions")
    .select("id, user_id, creator_id, tier_id, status, created_at, current_period_end, cancel_at_period_end");
  if (filter.creatorId) subQuery = subQuery.eq("creator_id", filter.creatorId);
  if (filter.userId) subQuery = subQuery.eq("user_id", filter.userId);
  const { data: subs } = await subQuery;
  const subRows: any[] = subs ?? [];
  if (subRows.length === 0) return;

  const tierIds = Array.from(new Set(subRows.map((s) => s.tier_id)));
  const { data: tiers } = await admin
    .from("creator_tiers")
    .select(
      "id, creator_id, name, price, currency, billing_interval, commercial_licence, commercial_licence_summary, commercial_licence_terms, commercial_units_limit, commercial_attribution_required",
    )
    .in("id", tierIds);
  const tierMap = new Map((tiers ?? []).map((t: any) => [t.id, t]));

  const creatorIds = Array.from(new Set(subRows.map((s) => s.creator_id)));
  const { data: creators } = await admin
    .from("creator_profiles")
    .select("id, display_name, slug")
    .in("id", creatorIds);
  const creatorMap = new Map((creators ?? []).map((c: any) => [c.id, c]));

  const userIds = Array.from(new Set(subRows.map((s) => s.user_id)));
  const { data: profiles } = await admin
    .from("profiles")
    .select("user_id, full_name, email")
    .in("user_id", userIds);
  const profileMap = new Map((profiles ?? []).map((p: any) => [p.user_id, p]));

  const { data: existing } = await admin
    .from("licences")
    .select("id, subscription_id, status")
    .in("subscription_id", subRows.map((s) => s.id));
  const existingMap = new Map((existing ?? []).map((l: any) => [l.subscription_id, l]));

  const toInsert: any[] = [];
  const toRevoke: string[] = [];
  const toReactivate: string[] = [];

  for (const s of subRows) {
    const tier: any = tierMap.get(s.tier_id);
    if (!tier?.commercial_licence) continue;
    const active = ACTIVE.includes(s.status);
    const row: any = existingMap.get(s.id);

    if (!row && active) {
      const creator: any = creatorMap.get(s.creator_id);
      const profile: any = profileMap.get(s.user_id);
      toInsert.push({
        user_id: s.user_id,
        creator_id: s.creator_id,
        tier_id: s.tier_id,
        subscription_id: s.id,
        status: "active",
        licensee_name: profile?.full_name ?? null,
        licensee_email: profile?.email ?? null,
        creator_name: creator?.display_name ?? "Creator",
        tier_name: tier.name,
        terms: {
          summary: tier.commercial_licence_summary ?? null,
          terms: tier.commercial_licence_terms ?? null,
          unitsLimit: tier.commercial_units_limit ?? null,
          attributionRequired: !!tier.commercial_attribution_required,
          price: Number(tier.price ?? 0),
          currency: tier.currency ?? "GBP",
          interval: tier.billing_interval ?? "month",
        },
      });
    } else if (row && !active && row.status === "active") {
      toRevoke.push(row.id);
    } else if (row && active && row.status !== "active") {
      toReactivate.push(row.id);
    }
  }

  if (toInsert.length) await admin.from("licences").insert(toInsert);
  if (toRevoke.length) {
    await admin
      .from("licences")
      .update({ status: "revoked", revoked_at: new Date().toISOString(), revoked_reason: "Subscription ended" })
      .in("id", toRevoke);
  }
  if (toReactivate.length) {
    await admin
      .from("licences")
      .update({ status: "active", revoked_at: null, revoked_reason: null })
      .in("id", toReactivate);
  }
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

    await syncLicences(supabaseAdmin, { creatorId: creator.id });

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

    const { data: licences } = await supabaseAdmin
      .from("licences")
      .select("subscription_id, licence_number, issued_at")
      .eq("creator_id", creator.id);
    const licenceMap = new Map((licences ?? []).map((l) => [l.subscription_id, l]));

    return (subs ?? []).map((s) => {
      const p = profileMap.get(s.user_id);
      const l = licenceMap.get(s.id);
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
        licenceNumber: l?.licence_number ?? null,
        issuedAt: l?.issued_at ?? null,
      };
    });
  });

/**
 * The caller's own commercial licence certificates, including revoked ones so
 * they keep a record of what they held and when it ended.
 */
export const myLicences = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MemberLicence[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await syncLicences(supabaseAdmin, { userId: context.userId });

    const { data: rows } = await supabaseAdmin
      .from("licences")
      .select(
        "id, licence_number, status, creator_id, creator_name, tier_name, terms, issued_at, revoked_at, subscription_id",
      )
      .eq("user_id", context.userId)
      .order("issued_at", { ascending: false });
    const licences = rows ?? [];
    if (licences.length === 0) return [];

    const { data: creators } = await supabaseAdmin
      .from("creator_profiles")
      .select("id, slug")
      .in("id", Array.from(new Set(licences.map((l) => l.creator_id))));
    const slugMap = new Map((creators ?? []).map((c) => [c.id, c.slug]));

    const subIds = licences.map((l) => l.subscription_id).filter(Boolean) as string[];
    const { data: subs } = subIds.length
      ? await supabaseAdmin
          .from("subscriptions")
          .select("id, current_period_end, cancel_at_period_end")
          .in("id", subIds)
      : { data: [] as any[] };
    const subMap = new Map((subs ?? []).map((s: any) => [s.id, s]));

    return licences.map((l) => {
      const sub: any = l.subscription_id ? subMap.get(l.subscription_id) : null;
      return {
        id: l.id,
        licenceNumber: l.licence_number,
        status: l.status,
        creatorId: l.creator_id,
        creatorName: l.creator_name,
        creatorSlug: slugMap.get(l.creator_id) ?? null,
        tierName: l.tier_name,
        issuedAt: l.issued_at,
        revokedAt: l.revoked_at,
        endsAt: sub?.current_period_end ?? null,
        cancelAtPeriodEnd: !!sub?.cancel_at_period_end,
        terms: (l.terms ?? {}) as MemberLicence["terms"],
      };
    });
  });
