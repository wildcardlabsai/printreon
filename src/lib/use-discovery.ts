import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Creator discovery (Explore, featured/trending, "find creators" links) stays
 * hidden until the platform has enough published creators to feel alive.
 * Raise or lower this single number to change the behaviour.
 */
export const DISCOVERY_MIN_CREATORS = 6;

let cachedCount: number | null = null;

export function usePublishedCreatorCount(): number | null {
  const [count, setCount] = useState<number | null>(cachedCount);

  useEffect(() => {
    if (cachedCount !== null) return;
    let active = true;
    supabase
      .from("creator_profiles")
      .select("id", { count: "exact", head: true })
      .eq("is_published", true)
      .is("suspended_at", null)
      .then(({ count: c }) => {
        cachedCount = c ?? 0;
        if (active) setCount(cachedCount);
      });
    return () => {
      active = false;
    };
  }, []);

  return count;
}

/**
 * True once enough creators are live. While loading we treat discovery as
 * hidden so links never flash in and then disappear.
 */
export function useDiscoveryEnabled(): boolean {
  const count = usePublishedCreatorCount();
  return (count ?? 0) >= DISCOVERY_MIN_CREATORS;
}
