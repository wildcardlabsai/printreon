import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth-context";

// Payout/Stripe columns are not readable through the Data API (they are
// internal financial metadata). The owner reads them via a security definer
// RPC scoped to auth.uid().
const CREATOR_COLUMNS =
  "id, user_id, display_name, slug, bio, short_intro, profile_image_url, banner_image_url, website_url, instagram_url, tiktok_url, youtube_url, cults_url, printables_url, makerworld_url, is_verified, is_published, platform_fee_percentage, suspended_at, suspension_reason, created_at, updated_at";

export function useCreatorProfile() {
  const { user, loading } = useAuth();
  const [creator, setCreator] = useState<any>(null);
  const [ready, setReady] = useState(false);

  const refresh = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("creator_profiles")
      .select(CREATOR_COLUMNS)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!data) {
      setCreator(null);
      setReady(true);
      return;
    }
    const { data: payout } = await supabase.rpc("my_payout_info");
    const info = Array.isArray(payout) ? payout[0] : payout;
    setCreator({
      ...data,
      connected_account_id: info?.connected_account_id ?? null,
      payout_status: info?.payout_status ?? null,
    });
    setReady(true);
  };

  useEffect(() => {
    if (loading) return;
    if (!user) { setReady(true); return; }
    refresh();
  }, [user, loading]);

  return { creator, ready, refresh };
}
