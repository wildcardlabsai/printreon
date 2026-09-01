-- Records the creator's confirmation that a file is not a raw, unedited AI export.
ALTER TABLE public.creator_files
  ADD COLUMN IF NOT EXISTS raw_ai_confirmed_at timestamptz;

-- Records acceptance of the quality standards during creator onboarding.
ALTER TABLE public.creator_profiles
  ADD COLUMN IF NOT EXISTS quality_standards_accepted_at timestamptz;