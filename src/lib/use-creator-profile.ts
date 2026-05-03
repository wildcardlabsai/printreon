import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth-context";

export function useCreatorProfile() {
  const { user, loading } = useAuth();
  const [creator, setCreator] = useState<any>(null);
  const [ready, setReady] = useState(false);

  const refresh = async () => {
    if (!user) return;
    const { data } = await supabase.from("creator_profiles").select("*").eq("user_id", user.id).maybeSingle();
    setCreator(data ?? null);
    setReady(true);
  };

  useEffect(() => {
    if (loading) return;
    if (!user) { setReady(true); return; }
    refresh();
  }, [user, loading]);

  return { creator, ready, refresh };
}
