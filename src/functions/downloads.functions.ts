import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const Input = z.object({ fileId: z.string().uuid() });

/**
 * Shared access check. Returns the file row when the user may access it,
 * otherwise throws with a user-facing reason.
 */
async function resolveAccessibleFile(fileId: string, userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: file, error: fileErr } = await supabaseAdmin
    .from("creator_files")
    .select("id, creator_id, file_url, file_type, is_free, is_published, tier_required_id, title, takedown_at")
    .eq("id", fileId)
    .maybeSingle();
  if (fileErr || !file) throw new Error("File not found");
  if (!file.file_url) throw new Error("This file has not been uploaded yet");
  if (file.takedown_at) throw new Error("This file is unavailable (takedown notice)");

  const { data: creatorOwn } = await supabaseAdmin
    .from("creator_profiles")
    .select("id, suspended_at")
    .eq("id", file.creator_id)
    .eq("user_id", userId)
    .maybeSingle();

  const { data: creatorState } = await supabaseAdmin
    .from("creator_profiles")
    .select("suspended_at")
    .eq("id", file.creator_id)
    .maybeSingle();
  if (creatorState?.suspended_at && !creatorOwn) {
    throw new Error("This creator's page is currently suspended");
  }

  let allowed = !!creatorOwn;
  if (!allowed && !file.is_published) throw new Error("File not available");
  if (!allowed && file.is_free) allowed = true;

  if (!allowed) {
    const { data: subs } = await supabaseAdmin
      .from("subscriptions")
      .select("id, tier_id, status, creator_tiers(price)")
      .eq("user_id", userId)
      .eq("creator_id", file.creator_id)
      .eq("status", "active");
    if (subs && subs.length > 0) {
      if (!file.tier_required_id) {
        allowed = true;
      } else {
        const { data: requiredTier } = await supabaseAdmin
          .from("creator_tiers")
          .select("price")
          .eq("id", file.tier_required_id)
          .maybeSingle();
        const requiredPrice = Number(requiredTier?.price ?? 0);
        allowed = subs.some((s: any) => Number(s.creator_tiers?.price ?? 0) >= requiredPrice);
      }
    }
  }

  if (!allowed) throw new Error("Subscribe to a qualifying tier to view this file");
  return file;
}

/**
 * Short-lived signed URL used only to stream geometry into the 3D viewer.
 * Runs the same access checks as a download but is not rate limited and does
 * not record a download.
 */
export const getFilePreviewUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => Input.parse(d))
  .handler(async ({ data, context }) => {
    const file = await resolveAccessibleFile(data.fileId, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage
      .from("files")
      .createSignedUrl(file.file_url!, 300);
    if (error || !signed) throw new Error("Could not create preview link");
    return { url: signed.signedUrl, fileType: file.file_type ?? null };
  });

export const getFileDownloadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => Input.parse(d))
  .handler(async ({ data, context }) => {
    const userId = context.userId;

    // Rate limit: max 60 downloads per rolling hour per user.
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentCount } = await supabaseAdmin
      .from("downloads")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("downloaded_at", hourAgo);
    if ((recentCount ?? 0) >= 60) {
      throw new Error("Download limit reached (60 per hour). Try again shortly.");
    }

    const { data: file, error: fileErr } = await supabaseAdmin
      .from("creator_files")
      .select(
        "id, creator_id, file_url, is_free, is_published, tier_required_id, title, takedown_at"
      )
      .eq("id", data.fileId)
      .maybeSingle();
    if (fileErr || !file) throw new Error("File not found");
    if (!file.file_url) throw new Error("This file has not been uploaded yet");
    if (file.takedown_at) throw new Error("This file is unavailable (takedown notice)");

    // Check if user is the creator
    const { data: creatorOwn } = await supabaseAdmin
      .from("creator_profiles")
      .select("id, suspended_at")
      .eq("id", file.creator_id)
      .eq("user_id", userId)
      .maybeSingle();

    const { data: creatorState } = await supabaseAdmin
      .from("creator_profiles")
      .select("suspended_at")
      .eq("id", file.creator_id)
      .maybeSingle();
    if (creatorState?.suspended_at && !creatorOwn) {
      throw new Error("This creator's page is currently suspended");
    }

    let allowed = !!creatorOwn;

    if (!allowed && !file.is_published) {
      throw new Error("File not available");
    }

    if (!allowed && file.is_free) {
      allowed = true;
    }

    if (!allowed) {
      // check active subscription on this creator (with sufficient tier)
      const { data: subs } = await supabaseAdmin
        .from("subscriptions")
        .select("id, tier_id, status, creator_tiers(price)")
        .eq("user_id", userId)
        .eq("creator_id", file.creator_id)
        .eq("status", "active");
      if (subs && subs.length > 0) {
        if (!file.tier_required_id) {
          allowed = true;
        } else {
          // need tier with price >= required tier price
          const { data: requiredTier } = await supabaseAdmin
            .from("creator_tiers")
            .select("price")
            .eq("id", file.tier_required_id)
            .maybeSingle();
          const requiredPrice = Number(requiredTier?.price ?? 0);
          allowed = subs.some((s: any) => Number(s.creator_tiers?.price ?? 0) >= requiredPrice);
        }
      }
    }

    if (!allowed) throw new Error("Subscribe to a qualifying tier to download this file");

    // Sign URL (10 min)
    const { data: signed, error: signErr } = await supabaseAdmin.storage
      .from("files")
      .createSignedUrl(file.file_url, 600, { download: file.title });
    if (signErr || !signed) throw new Error("Could not create download link");

    // Log download (best effort)
    await supabaseAdmin.from("downloads").insert({
      user_id: userId,
      file_id: file.id,
      creator_id: file.creator_id,
    });

    return { url: signed.signedUrl };
  });

/**
 * Creator-only hard delete: removes the stored object and the row.
 * The storage path never leaves the server.
 */
export const deleteCreatorFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => Input.parse(d))
  .handler(async ({ data, context }) => {
    const { data: file } = await supabaseAdmin
      .from("creator_files")
      .select("id, creator_id, file_url")
      .eq("id", data.fileId)
      .maybeSingle();
    if (!file) throw new Error("File not found");

    const { data: owned } = await supabaseAdmin
      .from("creator_profiles")
      .select("id")
      .eq("id", file.creator_id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!owned) throw new Error("You do not have permission to delete this file");

    if (file.file_url) {
      await supabaseAdmin.storage.from("files").remove([file.file_url]);
    }
    const { error } = await supabaseAdmin.from("creator_files").delete().eq("id", file.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
