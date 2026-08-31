CREATE TABLE public.changelog_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  entry_date date NOT NULL DEFAULT current_date,
  is_published boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.changelog_entries TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.changelog_entries TO authenticated;
GRANT ALL ON public.changelog_entries TO service_role;

ALTER TABLE public.changelog_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published changelog is public"
  ON public.changelog_entries FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

CREATE POLICY "Admins manage changelog"
  ON public.changelog_entries FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER tg_changelog_updated
  BEFORE UPDATE ON public.changelog_entries
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  name text,
  email text NOT NULL,
  type text NOT NULL DEFAULT 'idea',
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  admin_notes text,
  page_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.feedback TO authenticated;
GRANT ALL ON public.feedback TO service_role;

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read feedback"
  ON public.feedback FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update feedback"
  ON public.feedback FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER tg_feedback_updated
  BEFORE UPDATE ON public.feedback
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.submit_feedback(payload jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_id uuid;
  v_email text := lower(trim(payload->>'email'));
  v_message text := trim(payload->>'message');
  v_type text := coalesce(nullif(payload->>'type',''), 'idea');
BEGIN
  IF v_email IS NULL OR v_email = '' OR v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'invalid_email';
  END IF;
  IF v_message IS NULL OR length(v_message) < 5 THEN
    RAISE EXCEPTION 'message_required';
  END IF;
  IF length(v_message) > 4000 THEN
    RAISE EXCEPTION 'message_too_long';
  END IF;
  IF v_type NOT IN ('idea','bug','other') THEN
    v_type := 'other';
  END IF;

  INSERT INTO public.feedback (user_id, name, email, type, message, page_url, status)
  VALUES (
    auth.uid(),
    nullif(left(trim(coalesce(payload->>'name','')), 120), ''),
    left(v_email, 255),
    v_type,
    v_message,
    nullif(left(trim(coalesce(payload->>'page_url','')), 500), ''),
    'new'
  )
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_feedback(jsonb) TO anon, authenticated;