-- Moderation: creator suspension + file takedown state
ALTER TABLE public.creator_profiles
  ADD COLUMN IF NOT EXISTS suspended_at timestamptz,
  ADD COLUMN IF NOT EXISTS suspension_reason text;

ALTER TABLE public.creator_files
  ADD COLUMN IF NOT EXISTS takedown_at timestamptz,
  ADD COLUMN IF NOT EXISTS takedown_reason text;

-- Moderation queue metadata
ALTER TABLE public.admin_reports
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz,
  ADD COLUMN IF NOT EXISTS resolved_by uuid,
  ADD COLUMN IF NOT EXISTS resolution_notes text,
  ADD COLUMN IF NOT EXISTS parent_type text,
  ADD COLUMN IF NOT EXISTS parent_id uuid;

-- Billing: annual plans + free trials on tiers
ALTER TABLE public.creator_tiers
  ADD COLUMN IF NOT EXISTS billing_interval text NOT NULL DEFAULT 'month',
  ADD COLUMN IF NOT EXISTS trial_days integer NOT NULL DEFAULT 0;

-- Discovery indexes for search + trending
CREATE INDEX IF NOT EXISTS idx_creator_files_downloads ON public.creator_files (download_count DESC);
CREATE INDEX IF NOT EXISTS idx_creator_files_published_at ON public.creator_files (is_published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_downloads_user_time ON public.downloads (user_id, downloaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_outbox_status ON public.email_outbox (status, created_at DESC);
