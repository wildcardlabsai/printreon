-- 1. Grants for the existing file_versions table (Data API access)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.file_versions TO authenticated;
GRANT ALL ON public.file_versions TO service_role;

-- 2. Duplicate detection support
ALTER TABLE public.creator_files ADD COLUMN IF NOT EXISTS file_hash text;
CREATE INDEX IF NOT EXISTS idx_creator_files_hash ON public.creator_files (creator_id, file_hash);

-- 3. Issued commercial licences (snapshot of terms at issue time)
CREATE TABLE IF NOT EXISTS public.licences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  licence_number text NOT NULL UNIQUE,
  user_id uuid NOT NULL,
  creator_id uuid NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
  tier_id uuid NOT NULL REFERENCES public.creator_tiers(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active',
  licensee_name text,
  licensee_email text,
  creator_name text NOT NULL,
  tier_name text NOT NULL,
  terms jsonb NOT NULL DEFAULT '{}'::jsonb,
  issued_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  revoked_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_licences_unique_sub ON public.licences (subscription_id) WHERE subscription_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_licences_user ON public.licences (user_id);
CREATE INDEX IF NOT EXISTS idx_licences_creator ON public.licences (creator_id);

GRANT SELECT ON public.licences TO authenticated;
GRANT ALL ON public.licences TO service_role;

ALTER TABLE public.licences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Holders view their own licences"
  ON public.licences FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Creators view licences they issued"
  ON public.licences FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.creator_profiles cp WHERE cp.id = licences.creator_id AND cp.user_id = auth.uid()));

CREATE POLICY "Admins view all licences"
  ON public.licences FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. Licence number generator
CREATE OR REPLACE FUNCTION public.generate_licence_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  candidate text;
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i int;
BEGIN
  LOOP
    candidate := '';
    FOR i IN 1..8 LOOP
      candidate := candidate || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    END LOOP;
    candidate := 'PRN-' || to_char(now(), 'YYYY') || '-' || candidate;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.licences WHERE licence_number = candidate);
  END LOOP;
  RETURN candidate;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.generate_licence_number() FROM anon, authenticated;

ALTER TABLE public.licences ALTER COLUMN licence_number SET DEFAULT public.generate_licence_number();
