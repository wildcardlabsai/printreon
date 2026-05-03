
-- ========== ROLES ==========
CREATE TYPE public.app_role AS ENUM ('member', 'creator', 'admin');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ========== PROFILES ==========
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  username TEXT UNIQUE,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ========== CREATOR PROFILES ==========
CREATE TABLE public.creator_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  bio TEXT,
  short_intro TEXT,
  profile_image_url TEXT,
  banner_image_url TEXT,
  website_url TEXT,
  instagram_url TEXT,
  tiktok_url TEXT,
  youtube_url TEXT,
  cults_url TEXT,
  printables_url TEXT,
  makerworld_url TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT false,
  -- Stripe Connect readiness
  connected_account_id TEXT,
  payout_status TEXT DEFAULT 'not_setup',
  platform_fee_percentage NUMERIC(5,2) DEFAULT 10.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.creator_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published creators viewable by all" ON public.creator_profiles FOR SELECT USING (is_published = true OR auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert own creator profile" ON public.creator_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own creator profile" ON public.creator_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins manage creator profiles" ON public.creator_profiles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ========== CREATOR TIERS ==========
CREATE TABLE public.creator_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
  stripe_price_id TEXT,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  description TEXT,
  benefits JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.creator_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active tiers viewable by all" ON public.creator_tiers FOR SELECT USING (
  is_active = true OR EXISTS (SELECT 1 FROM public.creator_profiles cp WHERE cp.id = creator_id AND cp.user_id = auth.uid())
);
CREATE POLICY "Creators manage own tiers" ON public.creator_tiers FOR ALL USING (
  EXISTS (SELECT 1 FROM public.creator_profiles cp WHERE cp.id = creator_id AND cp.user_id = auth.uid())
);

-- ========== CREATOR FILES ==========
CREATE TABLE public.creator_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  file_type TEXT,
  file_url TEXT,
  file_size BIGINT,
  preview_images JSONB NOT NULL DEFAULT '[]'::jsonb,
  tags TEXT[] DEFAULT '{}',
  category TEXT,
  tier_required_id UUID REFERENCES public.creator_tiers(id) ON DELETE SET NULL,
  is_free BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT false,
  download_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(creator_id, slug)
);

ALTER TABLE public.creator_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published files metadata viewable by all" ON public.creator_files FOR SELECT USING (
  is_published = true OR EXISTS (SELECT 1 FROM public.creator_profiles cp WHERE cp.id = creator_id AND cp.user_id = auth.uid())
);
CREATE POLICY "Creators manage own files" ON public.creator_files FOR ALL USING (
  EXISTS (SELECT 1 FROM public.creator_profiles cp WHERE cp.id = creator_id AND cp.user_id = auth.uid())
);

-- ========== SUBSCRIPTIONS ==========
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
  tier_id UUID NOT NULL REFERENCES public.creator_tiers(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'incomplete',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Creators view own subscribers" ON public.subscriptions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.creator_profiles cp WHERE cp.id = creator_id AND cp.user_id = auth.uid())
);
CREATE POLICY "Admins view all subs" ON public.subscriptions FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- ========== DOWNLOADS ==========
CREATE TABLE public.downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
  file_id UUID NOT NULL REFERENCES public.creator_files(id) ON DELETE CASCADE,
  downloaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.downloads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own downloads" ON public.downloads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own downloads" ON public.downloads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Creators view own file downloads" ON public.downloads FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.creator_profiles cp WHERE cp.id = creator_id AND cp.user_id = auth.uid())
);

-- ========== FOLLOWERS ==========
CREATE TABLE public.followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, creator_id)
);

ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Followers viewable by all" ON public.followers FOR SELECT USING (true);
CREATE POLICY "Users follow" ON public.followers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users unfollow" ON public.followers FOR DELETE USING (auth.uid() = user_id);

-- ========== REFERRALS ==========
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  creator_id UUID REFERENCES public.creator_profiles(id) ON DELETE SET NULL,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reward_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own referrals" ON public.referrals FOR SELECT USING (auth.uid() = referrer_user_id OR auth.uid() = referred_user_id);
CREATE POLICY "Insert referrals" ON public.referrals FOR INSERT WITH CHECK (true);

-- ========== CREATOR ANNOUNCEMENTS ==========
CREATE TABLE public.creator_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  audience TEXT NOT NULL DEFAULT 'everyone',
  tier_id UUID REFERENCES public.creator_tiers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.creator_announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public announcements viewable" ON public.creator_announcements FOR SELECT USING (
  audience = 'everyone' OR
  EXISTS (SELECT 1 FROM public.creator_profiles cp WHERE cp.id = creator_id AND cp.user_id = auth.uid()) OR
  (audience = 'followers' AND EXISTS (SELECT 1 FROM public.followers f WHERE f.creator_id = creator_id AND f.user_id = auth.uid())) OR
  (audience = 'subscribers' AND EXISTS (SELECT 1 FROM public.subscriptions s WHERE s.creator_id = creator_id AND s.user_id = auth.uid() AND s.status = 'active'))
);
CREATE POLICY "Creators manage own announcements" ON public.creator_announcements FOR ALL USING (
  EXISTS (SELECT 1 FROM public.creator_profiles cp WHERE cp.id = creator_id AND cp.user_id = auth.uid())
);

-- ========== ADMIN REPORTS ==========
CREATE TABLE public.admin_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reported_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  creator_id UUID REFERENCES public.creator_profiles(id) ON DELETE SET NULL,
  file_id UUID REFERENCES public.creator_files(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users insert reports" ON public.admin_reports FOR INSERT WITH CHECK (auth.uid() = reported_by);
CREATE POLICY "Admins manage reports" ON public.admin_reports FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ========== WAITLIST ==========
CREATE TABLE public.waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  role_interest TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can join waitlist" ON public.waitlist FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins view waitlist" ON public.waitlist FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- ========== TRIGGERS ==========
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'member');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER tr_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER tr_creator_profiles_updated BEFORE UPDATE ON public.creator_profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER tr_creator_files_updated BEFORE UPDATE ON public.creator_files FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER tr_subscriptions_updated BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ========== STORAGE BUCKETS ==========
INSERT INTO storage.buckets (id, name, public) VALUES
  ('avatars', 'avatars', true),
  ('banners', 'banners', true),
  ('previews', 'previews', true),
  ('files', 'files', false);

-- Public read for public buckets
CREATE POLICY "Public read avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Public read banners" ON storage.objects FOR SELECT USING (bucket_id = 'banners');
CREATE POLICY "Public read previews" ON storage.objects FOR SELECT USING (bucket_id = 'previews');

-- Authenticated users upload to their own folder (path: {user_id}/...)
CREATE POLICY "Users upload own avatars" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users update own avatars" ON storage.objects FOR UPDATE USING (
  bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users upload own banners" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'banners' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users upload own previews" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'previews' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users upload own files" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'files' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Owners read own files" ON storage.objects FOR SELECT USING (
  bucket_id = 'files' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Owners delete own storage" ON storage.objects FOR DELETE USING (
  auth.uid()::text = (storage.foldername(name))[1]
);
