
CREATE TABLE IF NOT EXISTS public.beta_preregistrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  full_name text,
  creator_name text,
  website_url text,
  social_url text,
  current_platform text,
  audience_size text,
  sells_stls boolean NOT NULL DEFAULT false,
  sells_physical_prints boolean NOT NULL DEFAULT false,
  interested_in_commercial_licensing boolean NOT NULL DEFAULT false,
  reason_for_joining text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','shortlisted','invited','accepted','rejected','waitlist')),
  invite_code text,
  invited_at timestamptz,
  accepted_at timestamptz,
  notes text,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_betapre_status ON public.beta_preregistrations(status);
CREATE INDEX IF NOT EXISTS idx_betapre_created ON public.beta_preregistrations(created_at DESC);
ALTER TABLE public.beta_preregistrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can preregister" ON public.beta_preregistrations FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins manage preregistrations" ON public.beta_preregistrations FOR ALL USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_betapre_touch BEFORE UPDATE ON public.beta_preregistrations FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.invite_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  email text,
  preregistration_id uuid REFERENCES public.beta_preregistrations(id) ON DELETE SET NULL,
  created_by uuid,
  max_uses integer NOT NULL DEFAULT 1,
  uses integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','used','expired','revoked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  used_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_invites_status ON public.invite_codes(status);
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage invites" ON public.invite_codes FOR ALL USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Public can read invite by code" ON public.invite_codes FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.admin_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid,
  action text NOT NULL,
  target_type text,
  target_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_adminlog_created ON public.admin_activity_log(created_at DESC);
ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view log" ON public.admin_activity_log FOR SELECT USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins insert log" ON public.admin_activity_log FOR INSERT WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.platform_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  audience text NOT NULL DEFAULT 'all' CHECK (audience IN ('all','creators','beta_users','admins')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  published_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.platform_announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage announcements" ON public.platform_announcements FOR ALL USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Public view published announcements" ON public.platform_announcements FOR SELECT USING (status='published');
CREATE TRIGGER trg_announcements_touch BEFORE UPDATE ON public.platform_announcements FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent'));
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS assigned_to uuid;
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS admin_notes text;

ALTER TABLE public.feature_flags ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.feature_flags ADD COLUMN IF NOT EXISTS audience text NOT NULL DEFAULT 'all';

INSERT INTO public.feature_flags (key, name, description, enabled) VALUES
  ('creator_hub_enabled','Creator Hub','Enable creator hub features',true),
  ('stripe_payments_enabled','Stripe Payments','Enable paid memberships',false),
  ('stl_uploads_enabled','STL Uploads','Allow creators to upload STL files',true),
  ('public_creator_pages_enabled','Public Creator Pages','Show public /c/:slug pages',true),
  ('commercial_licensing_enabled','Commercial Licensing','Enable commercial licensing tier option',false),
  ('analytics_enabled','Analytics','Enable analytics tracking',true)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
VALUES ('49258270-0409-413c-9da5-770fc158e2bf','admin')
ON CONFLICT (user_id, role) DO NOTHING;
