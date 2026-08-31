ALTER TABLE public.creator_tiers
  ADD COLUMN IF NOT EXISTS commercial_licence boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS commercial_licence_summary text,
  ADD COLUMN IF NOT EXISTS commercial_licence_terms text,
  ADD COLUMN IF NOT EXISTS commercial_units_limit integer,
  ADD COLUMN IF NOT EXISTS commercial_attribution_required boolean NOT NULL DEFAULT false;