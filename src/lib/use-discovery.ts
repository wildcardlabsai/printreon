import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Creator discovery (Explore, featured/trending, "find creators" links) stays
 * hidden until the platform has enough published creators to feel alive.
 * Raise or lower this single number to change the behaviour.
 */
export const DISCOVERY_MIN_CREATORS = 6;

export function usePublishedCreatorCount() {
  return useQuery({
    queryKey: ["published-creator-count"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("creator_profiles")
        .select("id", { count: "exact", head: true })
        .eq("is_published", true)
        .is("suspended_at", null);
      if (error) throw error;
      return count ?? 0;
    },
  });
}

/**
 * True once enough creators are live. While loading we treat discovery as
 * hidden so links never flash in and then disappear.
 */
export function useDiscoveryEnabled(): boolean {
  const { data } = usePublishedCreatorCount();
  return (data ?? 0) >= DISCOVERY_MIN_CREATORS;
}
