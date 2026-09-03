import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ADMIN_EMAIL = "mattoftaylor@gmail.com";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function assertAdmin(userId: string) {
  const db = await admin();
  const { data } = await db
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Admin only");
}

async function send(template: string, to: string, options: Record<string, any> = {}) {
  const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
  try {
    return await sendTemplateEmail(template, to, options);
  } catch (e: any) {
    console.error(`[email] ${template} failed:`, e?.message ?? e);
    return { sent: false as const, reason: "error" };
  }
}

/* ------------------------------ public forms ------------------------------ */

export const submitContactMessage = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        email: z.string().trim().email().max(255),
        subject: z.string().trim().min(2).max(200),
        body: z.string().trim().min(5).max(5000),
        category: z.string().trim().max(40).default("general"),
        userId: z.string().uuid().nullable().optional(),
      })
      .parse(d)
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: row, error } = await db
      .from("support_tickets")
      .insert({
        email: data.email,
        subject: data.subject,
        body: data.body,
        category: data.category,
        user_id: data.userId ?? null,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    await send("admin-contact-notice", ADMIN_EMAIL, {
      templateData: {
        subject: data.subject,
        category: data.category,
        email: data.email,
        message: data.body,
      },
      idempotencyKey: `contact-${row.id}`,
      replyTo: data.email,
    });
    return { ok: true };
  });

/** Notifies the admin inbox after a feedback row has been created. */
export const notifyFeedbackSubmitted = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        feedbackId: z.string().uuid(),
      })
      .parse(d)
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: row } = await db
      .from("feedback")
      .select("id, type, name, email, message, page_url")
      .eq("id", data.feedbackId)
      .maybeSingle();
    if (!row) return { ok: false };

    await send("admin-feedback-notice", ADMIN_EMAIL, {
      templateData: {
        type: row.type,
        name: row.name,
        email: row.email,
        message: row.message,
        pageUrl: row.page_url,
      },
      idempotencyKey: `feedback-${row.id}`,
      replyTo: row.email ?? undefined,
    });
    return { ok: true };
  });

/** Notifies the admin inbox about a new beta application. */
export const notifyBetaApplication = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ email: z.string().trim().email().max(255) }).parse(d))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: row } = await db
      .from("beta_preregistrations")
      .select("*")
      .ilike("email", data.email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!row) return { ok: false };

    await send("admin-beta-application-notice", ADMIN_EMAIL, {
      templateData: {
        email: row.email,
        fullName: row.full_name,
        creatorName: row.creator_name,
        role: row.source,
        currentPlatform: row.current_platform,
        audienceSize: row.audience_size,
        sellsStls: row.sells_stls,
        sellsPrints: row.sells_physical_prints,
        commercial: row.interested_in_commercial_licensing,
        frustration: row.biggest_frustration,
      },
      idempotencyKey: `beta-app-${row.id}`,
      replyTo: row.email,
    });
    return { ok: true };
  });

export const subscribeNewsletter = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        email: z.string().trim().email().max(255),
        name: z.string().trim().max(120).optional().or(z.literal("")),
        source: z.string().trim().max(40).default("site"),
      })
      .parse(d)
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const email = data.email.toLowerCase();
    const { data: existing } = await db
      .from("newsletter_subscribers")
      .select("id, status")
      .ilike("email", email)
      .maybeSingle();

    if (existing) {
      if (existing.status !== "subscribed") {
        await db
          .from("newsletter_subscribers")
          .update({ status: "subscribed", updated_at: new Date().toISOString() })
          .eq("id", existing.id);
      }
      return { ok: true, alreadySubscribed: true };
    }

    const { data: row, error } = await db
      .from("newsletter_subscribers")
      .insert({ email, name: data.name || null, source: data.source })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    await send("newsletter-welcome", email, {
      templateData: { name: data.name || undefined },
      idempotencyKey: `newsletter-welcome-${row.id}`,
    });
    return { ok: true, alreadySubscribed: false };
  });

/* -------------------------------- admin ---------------------------------- */

export type InboxKind = "feedback" | "application" | "contact";

export interface InboxItem {
  id: string;
  kind: InboxKind;
  subject: string;
  body: string;
  fromName: string | null;
  fromEmail: string;
  status: string;
  notes: string | null;
  createdAt: string;
  meta: Record<string, any>;
}

export const adminInboxList = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        kind: z.enum(["all", "feedback", "application", "contact"]).default("all"),
        search: z.string().trim().max(120).default(""),
      })
      .parse(d)
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const db = await admin();

    const items: InboxItem[] = [];

    if (data.kind === "all" || data.kind === "feedback") {
      const { data: rows } = await db
        .from("feedback")
        .select("id, type, name, email, message, status, admin_notes, page_url, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      for (const r of rows ?? []) {
        items.push({
          id: r.id,
          kind: "feedback",
          subject: `${r.type ?? "feedback"} — feedback`,
          body: r.message,
          fromName: r.name,
          fromEmail: r.email,
          status: r.status,
          notes: r.admin_notes,
          createdAt: r.created_at,
          meta: { type: r.type, pageUrl: r.page_url },
        });
      }
    }

    if (data.kind === "all" || data.kind === "contact") {
      const { data: rows } = await db
        .from("support_tickets")
        .select("id, email, subject, body, category, status, admin_notes, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      for (const r of rows ?? []) {
        items.push({
          id: r.id,
          kind: "contact",
          subject: r.subject,
          body: r.body,
          fromName: null,
          fromEmail: r.email,
          status: r.status,
          notes: r.admin_notes,
          createdAt: r.created_at,
          meta: { category: r.category },
        });
      }
    }

    if (data.kind === "all" || data.kind === "application") {
      const { data: rows } = await db
        .from("beta_preregistrations")
        .select(
          "id, email, full_name, creator_name, current_platform, audience_size, sells_stls, sells_physical_prints, interested_in_commercial_licensing, biggest_frustration, status, notes, invite_code, created_at"
        )
        .order("created_at", { ascending: false })
        .limit(200);
      for (const r of rows ?? []) {
        items.push({
          id: r.id,
          kind: "application",
          subject: `Beta application — ${r.creator_name || r.full_name || r.email}`,
          body: r.biggest_frustration || "(no additional detail)",
          fromName: r.creator_name || r.full_name,
          fromEmail: r.email,
          status: r.status,
          notes: r.notes,
          createdAt: r.created_at,
          meta: {
            currentPlatform: r.current_platform,
            audienceSize: r.audience_size,
            sellsStls: r.sells_stls,
            sellsPrints: r.sells_physical_prints,
            commercial: r.interested_in_commercial_licensing,
            inviteCode: r.invite_code,
          },
        });
      }
    }

    const q = data.search.toLowerCase();
    const filtered = q
      ? items.filter(
          (i) =>
            i.fromEmail.toLowerCase().includes(q) ||
            (i.fromName ?? "").toLowerCase().includes(q) ||
            i.subject.toLowerCase().includes(q) ||
            i.body.toLowerCase().includes(q)
        )
      : items;

    filtered.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

    const tally = {
      total: filtered.length,
      feedback: filtered.filter((i) => i.kind === "feedback").length,
      application: filtered.filter((i) => i.kind === "application").length,
      contact: filtered.filter((i) => i.kind === "contact").length,
      unread: filtered.filter((i) => ["new", "open", "pending"].includes(i.status)).length,
    };

    return { items: filtered, tally };
  });

export const adminInboxUpdate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        kind: z.enum(["feedback", "application", "contact"]),
        id: z.string().uuid(),
        status: z.string().trim().max(40).optional(),
        notes: z.string().trim().max(4000).optional(),
      })
      .parse(d)
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const db = await admin();
    if (data.kind === "feedback") {
      const { error } = await db
        .from("feedback")
        .update({
          ...(data.status !== undefined ? { status: data.status } : {}),
          ...(data.notes !== undefined ? { admin_notes: data.notes } : {}),
        })
        .eq("id", data.id);
      if (error) throw new Error(error.message);
    } else if (data.kind === "contact") {
      const { error } = await db
        .from("support_tickets")
        .update({
          ...(data.status !== undefined ? { status: data.status } : {}),
          ...(data.notes !== undefined ? { admin_notes: data.notes } : {}),
        })
        .eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await db
        .from("beta_preregistrations")
        .update({
          ...(data.status !== undefined ? { status: data.status } : {}),
          ...(data.notes !== undefined ? { notes: data.notes } : {}),
        })
        .eq("id", data.id);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

/** Sends a real beta invite email to one applicant and marks them invited. */
export const adminSendBetaInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        email: z.string().trim().email().max(255),
        name: z.string().trim().max(120).optional().or(z.literal("")),
        applicationId: z.string().uuid().optional(),
      })
      .parse(d)
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const db = await admin();

    const inviteCode = `PRN-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    await db.from("invite_codes").insert({
      code: inviteCode,
      email: data.email.toLowerCase(),
      preregistration_id: data.applicationId ?? null,
      max_uses: 1,
      status: "active",
    });

    const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
    const result = await sendTemplateEmail("beta-invite", data.email, {
      templateData: {
        name: data.name || undefined,
        inviteCode,
        signupUrl: `https://printreon.com/join?invite=${inviteCode}`,
      },
      idempotencyKey: `beta-invite-${data.applicationId ?? data.email}-${inviteCode}`,
    });

    if (data.applicationId) {
      await db
        .from("beta_preregistrations")
        .update({ status: "invited", invite_code: inviteCode, invited_at: new Date().toISOString() })
        .eq("id", data.applicationId);
      await db.from("admin_activity_log").insert({
        action: "invite.sent",
        target_type: "beta_preregistration",
        target_id: data.applicationId,
        metadata: { code: inviteCode, email: data.email },
      });
    }
    return { ...result, inviteCode, inviteUrl: `https://printreon.com/join?invite=${inviteCode}` };
  });

/* ----------------------------- newsletter admin --------------------------- */

export const adminNewsletterList = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ status: z.enum(["all", "subscribed", "unsubscribed"]).default("all") }).parse(d)
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const db = await admin();
    let q = db
      .from("newsletter_subscribers")
      .select("id, email, name, source, status, created_at")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (data.status !== "all") q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const { data: all } = await db.from("newsletter_subscribers").select("status");
    const tally = {
      total: all?.length ?? 0,
      subscribed: (all ?? []).filter((r: any) => r.status === "subscribed").length,
      unsubscribed: (all ?? []).filter((r: any) => r.status === "unsubscribed").length,
    };
    return { rows: rows ?? [], tally };
  });

export const adminNewsletterSetStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ id: z.string().uuid(), status: z.enum(["subscribed", "unsubscribed"]) }).parse(d)
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const db = await admin();
    const { error } = await db
      .from("newsletter_subscribers")
      .update({ status: data.status, updated_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Resends the welcome email to one existing subscriber. */
export const adminNewsletterResendWelcome = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const db = await admin();
    const { data: row } = await db
      .from("newsletter_subscribers")
      .select("id, email, name")
      .eq("id", data.id)
      .maybeSingle();
    if (!row) throw new Error("Subscriber not found");
    const result = await send("newsletter-welcome", row.email, {
      templateData: { name: row.name || undefined },
      idempotencyKey: `newsletter-welcome-resend-${row.id}-${Date.now()}`,
    });
    return result;
  });

/** One-off deliverability check: sends a live invite + feedback notice to the admin address. */
export const adminSendEmailSelfTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
    const stamp = Date.now();
    const invite = await sendTemplateEmail("beta-invite", ADMIN_EMAIL, {
      templateData: {
        name: "Matt",
        inviteCode: "PRN-TEST01",
        signupUrl: "https://printreon.com/join?invite=PRN-TEST01",
      },
      idempotencyKey: `selftest-invite-${stamp}`,
    });
    const feedback = await sendTemplateEmail("admin-feedback-notice", ADMIN_EMAIL, {
      templateData: {
        type: "test",
        name: "Printreon self-test",
        email: ADMIN_EMAIL,
        message: "This is a live delivery test of the feedback notification email.",
        pageUrl: "https://printreon.com/feedback",
      },
      idempotencyKey: `selftest-feedback-${stamp}`,
    });
    return { invite, feedback };
  });
