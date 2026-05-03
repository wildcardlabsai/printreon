import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const Input = z.object({ fileId: z.string().uuid() });

export const getFileDownloadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => Input.parse(d))
  .handler(async ({ data, context }) => {
    const userId = context.userId;

    const { data: file, error: fileErr } = await supabaseAdmin
      .from("creator_files")
      .select("id, creator_id, file_url, is_free, is_published, tier_required_id, title")
      .eq("id", data.fileId)
      .maybeSingle();
    if (fileErr || !file) throw new Error("File not found");
    if (!file.file_url) throw new Error("This file has not been uploaded yet");

    // Check if user is the creator
    const { data: creatorOwn } = await supabaseAdmin
      .from("creator_profiles")
      .select("id")
      .eq("id", file.creator_id)
      .eq("user_id", userId)
      .maybeSingle();

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
