import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Number of approved files a new creator needs before publishing instantly. */
export const TRUST_THRESHOLD = 3;
/** Below this success rate (with enough reports) a file gets pulled for review. */
const MIN_SUCCESS_RATE = 0.4;
const MIN_REPORTS_TO_FLAG = 5;

async function assertAdmin(userId: string, supabase: any) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!data) throw new Error("Admin only");
}

/** Admin: files waiting on first-upload review or auto-flagged. */
export const listFilesForReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId, context.supabase);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("creator_files")
      .select(
        "id, title, slug, category, file_type, file_size, creation_method, ai_disclosure_note, quality_flags, review_status, review_notes, preview_images, dim_x, dim_y, dim_z, triangle_count, created_at, creator_id, creator_profiles(display_name, slug, trusted_at)"
      )
      .in("review_status", ["pending", "flagged"])
      .order("created_at", { ascending: true })
      .limit(200);
    if (error) throw new Error(error.message);
    return { files: data ?? [] };
  });

/** Admin: approve or reject a file in the review queue. */
export const reviewFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        fileId: z.string().uuid(),
        decision: z.enum(["approve", "reject"]),
        notes: z.string().max(1000).optional(),
      })
      .parse(d)
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId, context.supabase);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: file, error: fErr } = await supabaseAdmin
      .from("creator_files")
      .select("id, title, creator_id")
      .eq("id", data.fileId)
      .maybeSingle();
    if (fErr || !file) throw new Error("File not found");

    const approved = data.decision === "approve";
    const { error } = await supabaseAdmin
      .from("creator_files")
      .update({
        review_status: approved ? "approved" : "rejected",
        is_published: approved,
        reviewed_at: new Date().toISOString(),
        reviewed_by: context.userId,
        review_notes: data.notes ?? null,
        ...(approved ? { quality_flags: [] } : {}),
      })
      .eq("id", data.fileId);
    if (error) throw new Error(error.message);

    let trusted = false;
    if (approved) {
      const { count } = await supabaseAdmin
        .from("creator_files")
        .select("id", { count: "exact", head: true })
        .eq("creator_id", file.creator_id)
        .eq("review_status", "approved");
      if ((count ?? 0) >= TRUST_THRESHOLD) {
        await supabaseAdmin
          .from("creator_profiles")
          .update({ trusted_at: new Date().toISOString() })
          .eq("id", file.creator_id)
          .is("trusted_at", null);
        trusted = true;
      }
    }

    const { data: owner } = await supabaseAdmin
      .from("creator_profiles")
      .select("user_id")
      .eq("id", file.creator_id)
      .maybeSingle();
    if (owner?.user_id) {
      await supabaseAdmin.from("notifications").insert({
        user_id: owner.user_id,
        type: approved ? "file_approved" : "file_rejected",
        title: approved ? `"${file.title}" is live` : `"${file.title}" was not approved`,
        body: approved
          ? trusted
            ? "Your files now publish instantly."
            : "Reviewed and published."
          : data.notes ?? "Please review the file quality guidelines and re-upload.",
        link: "/dashboard/files",
      });
    }

    await supabaseAdmin.from("admin_activity_log").insert({
      admin_user_id: context.userId,
      action: approved ? "file.review_approved" : "file.review_rejected",
      target_type: "creator_file",
      target_id: data.fileId,
      metadata: { notes: data.notes ?? null } as never,
    });

    return { ok: true, trusted };
  });

/** Buyer: report whether a downloaded file actually printed. */
export const submitPrintReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        fileId: z.string().uuid(),
        outcome: z.enum(["success", "failed", "not_printed"]),
        note: z.string().max(1000).optional(),
      })
      .parse(d)
  )
  .handler(async ({ data, context }) => {
    const { data: file } = await context.supabase
      .from("creator_files")
      .select("id, creator_id, title")
      .eq("id", data.fileId)
      .maybeSingle();
    if (!file) throw new Error("File not found");

    const { error } = await context.supabase.from("file_print_reports").upsert(
      {
        user_id: context.userId,
        file_id: data.fileId,
        creator_id: file.creator_id,
        outcome: data.outcome,
        note: data.note ?? null,
      },
      { onConflict: "user_id,file_id" }
    );
    if (error) throw new Error(error.message);

    // Auto-flag persistently failing files for admin review.
    const { data: stats } = await context.supabase.rpc("file_quality_stats", { _file_id: data.fileId });
    const row: any = Array.isArray(stats) ? stats[0] : stats;
    let flagged = false;
    if (row && row.total >= MIN_REPORTS_TO_FLAG && Number(row.success_rate) < MIN_SUCCESS_RATE) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin
        .from("creator_files")
        .update({ review_status: "flagged", is_published: false })
        .eq("id", data.fileId)
        .neq("review_status", "flagged");
      flagged = true;
    }
    return { ok: true, flagged };
  });

/** Public: aggregate print-success stats for a set of files. */
export const getFileQualityStats = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ fileIds: z.array(z.string().uuid()).max(100) }).parse(d))
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"]!;
    const client = createClient(process.env["SUPABASE_URL"]!, key, {
      auth: { persistSession: false },
      global: {
        fetch: (input: any, init: any) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });
    const out: Record<string, { total: number; successRate: number | null }> = {};
    for (const id of data.fileIds) {
      const { data: stats } = await client.rpc("file_quality_stats", { _file_id: id });
      const row: any = Array.isArray(stats) ? stats[0] : stats;
      out[id] = { total: row?.total ?? 0, successRate: row?.success_rate == null ? null : Number(row.success_rate) };
    }
    return out;
  });
