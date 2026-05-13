
ALTER TABLE public.beta_preregistrations
  ADD COLUMN IF NOT EXISTS biggest_frustration text,
  ADD COLUMN IF NOT EXISTS referral_code text,
  ADD COLUMN IF NOT EXISTS referred_by text,
  ADD COLUMN IF NOT EXISTS referral_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS founder_pricing_eligible boolean NOT NULL DEFAULT true;

CREATE UNIQUE INDEX IF NOT EXISTS beta_preregistrations_referral_code_key
  ON public.beta_preregistrations (referral_code);

CREATE UNIQUE INDEX IF NOT EXISTS beta_preregistrations_email_lower_key
  ON public.beta_preregistrations (lower(email));

CREATE OR REPLACE FUNCTION public.generate_beta_referral_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  candidate text;
  alphabet  text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i int;
BEGIN
  LOOP
    candidate := '';
    FOR i IN 1..8 LOOP
      candidate := candidate || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.beta_preregistrations WHERE referral_code = candidate);
  END LOOP;
  RETURN candidate;
END;
$$;

CREATE OR REPLACE FUNCTION public.beta_preregistrations_set_defaults()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.referral_code IS NULL OR length(NEW.referral_code) = 0 THEN
    NEW.referral_code := public.generate_beta_referral_code();
  END IF;

  IF NEW.referred_by IS NOT NULL AND length(NEW.referred_by) > 0 THEN
    UPDATE public.beta_preregistrations
       SET referral_count = referral_count + 1,
           updated_at = now()
     WHERE referral_code = NEW.referred_by;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_beta_preregistrations_defaults ON public.beta_preregistrations;
CREATE TRIGGER trg_beta_preregistrations_defaults
  BEFORE INSERT ON public.beta_preregistrations
  FOR EACH ROW EXECUTE FUNCTION public.beta_preregistrations_set_defaults();

CREATE OR REPLACE FUNCTION public.get_beta_referral_stats(_code text)
RETURNS TABLE(referral_count integer, status text, founder_pricing_eligible boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT referral_count, status, founder_pricing_eligible
  FROM public.beta_preregistrations
  WHERE referral_code = _code
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_beta_referral_stats(text) TO anon, authenticated;
