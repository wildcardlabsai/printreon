-- 1. Disclosure / review / quality columns on creator_files
ALTER TABLE public.creator_files
  ADD COLUMN IF NOT EXISTS creation_method text,
  ADD COLUMN IF NOT EXISTS ai_disclosure_note text,
  ADD COLUMN IF NOT EXISTS review_status text NOT NULL DEFAULT 'not_required',
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS review_notes text,
  ADD COLUMN IF NOT EXISTS quality_flags jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS print_verified_image_url text,
  ADD COLUMN IF NOT EXISTS print_verified_at timestamptz;

-- 2. Creator trust flag
ALTER TABLE public.creator_profiles
  ADD COLUMN IF NOT EXISTS trusted_at timestamptz;

-- Existing creators with published files keep publishing instantly.
UPDATE public.creator_profiles cp
   SET trusted_at = now()
 WHERE trusted_at IS NULL
   AND EXISTS (SELECT 1 FROM public.creator_files f WHERE f.creator_id = cp.id AND f.is_published = true);

-- 3. Buyer print outcome reports
CREATE TABLE IF NOT EXISTS public.file_print_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  file_id uuid NOT NULL REFERENCES public.creator_files(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
  outcome text NOT NULL CHECK (outcome IN ('success','failed','not_printed')),
  note text,
  photo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, file_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.file_print_reports TO authenticated;
GRANT ALL ON public.file_print_reports TO service_role;

ALTER TABLE public.file_print_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own print reports" ON public.file_print_reports;
CREATE POLICY "own print reports" ON public.file_print_reports
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "creator reads reports on own files" ON public.file_print_reports;
CREATE POLICY "creator reads reports on own files" ON public.file_print_reports
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.creator_profiles cp
    WHERE cp.id = file_print_reports.creator_id AND cp.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "admins read reports" ON public.file_print_reports;
CREATE POLICY "admins read reports" ON public.file_print_reports
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_file_print_reports_file ON public.file_print_reports(file_id);

-- 4. Public aggregate of print outcomes (raw rows stay private)
CREATE OR REPLACE FUNCTION public.file_quality_stats(_file_id uuid)
RETURNS TABLE(total integer, successes integer, failures integer, success_rate numeric)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    count(*) FILTER (WHERE outcome IN ('success','failed'))::int,
    count(*) FILTER (WHERE outcome = 'success')::int,
    count(*) FILTER (WHERE outcome = 'failed')::int,
    CASE WHEN count(*) FILTER (WHERE outcome IN ('success','failed')) = 0 THEN NULL
         ELSE round(
           count(*) FILTER (WHERE outcome = 'success')::numeric
           / count(*) FILTER (WHERE outcome IN ('success','failed'))::numeric, 3)
    END
  FROM public.file_print_reports
  WHERE file_id = _file_id;
$$;

GRANT EXECUTE ON FUNCTION public.file_quality_stats(uuid) TO anon, authenticated;

-- 5. Enforce disclosure + review gating at the database level
CREATE OR REPLACE FUNCTION public.enforce_file_publish_rules()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trusted timestamptz;
  v_role text := coalesce(current_setting('request.jwt.claims', true)::jsonb->>'role', '');
BEGIN
  -- Privileged/admin paths (service role) manage review outcomes directly.
  IF v_role = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.is_published = true AND coalesce(OLD.is_published, false) = false THEN
    IF NEW.creation_method IS NULL OR NEW.creation_method NOT IN ('hand','ai_assisted','ai_generated') THEN
      RAISE EXCEPTION 'Tell us how this model was made before publishing.';
    END IF;

    SELECT trusted_at INTO v_trusted FROM public.creator_profiles WHERE id = NEW.creator_id;

    IF v_trusted IS NULL OR jsonb_array_length(coalesce(NEW.quality_flags, '[]'::jsonb)) > 0 THEN
      NEW.is_published := false;
      NEW.review_status := 'pending';
    ELSE
      NEW.review_status := 'approved';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enforce_file_publish_rules() FROM anon, authenticated;

DROP TRIGGER IF EXISTS trg_enforce_file_publish_rules ON public.creator_files;
CREATE TRIGGER trg_enforce_file_publish_rules
  BEFORE UPDATE ON public.creator_files
  FOR EACH ROW EXECUTE FUNCTION public.enforce_file_publish_rules();
