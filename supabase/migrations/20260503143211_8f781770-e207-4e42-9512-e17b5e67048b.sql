
-- ============ CREATOR POSTS (long-form feed) ============
CREATE TABLE public.creator_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  cover_image_url text,
  audience text NOT NULL DEFAULT 'everyone', -- everyone | followers | subscribers | tier
  tier_id uuid REFERENCES public.creator_tiers(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'published', -- draft | scheduled | published
  scheduled_at timestamptz,
  published_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.creator_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators manage own posts" ON public.creator_posts FOR ALL
  USING (EXISTS (SELECT 1 FROM creator_profiles cp WHERE cp.id = creator_posts.creator_id AND cp.user_id = auth.uid()));
CREATE POLICY "View posts by audience" ON public.creator_posts FOR SELECT
  USING (
    status = 'published' AND (
      audience = 'everyone'
      OR EXISTS (SELECT 1 FROM creator_profiles cp WHERE cp.id = creator_posts.creator_id AND cp.user_id = auth.uid())
      OR (audience = 'followers' AND EXISTS (SELECT 1 FROM followers f WHERE f.creator_id = creator_posts.creator_id AND f.user_id = auth.uid()))
      OR (audience = 'subscribers' AND EXISTS (SELECT 1 FROM subscriptions s WHERE s.creator_id = creator_posts.creator_id AND s.user_id = auth.uid() AND s.status = 'active'))
      OR (audience = 'tier' AND EXISTS (SELECT 1 FROM subscriptions s WHERE s.creator_id = creator_posts.creator_id AND s.user_id = auth.uid() AND s.status = 'active' AND s.tier_id = creator_posts.tier_id))
    )
  );
CREATE TRIGGER tg_posts_updated BEFORE UPDATE ON public.creator_posts FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ COMMENTS (on posts and files) ============
CREATE TABLE public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  parent_type text NOT NULL, -- 'post' | 'file'
  parent_id uuid NOT NULL,
  creator_id uuid NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
  body text NOT NULL,
  reply_to uuid REFERENCES public.comments(id) ON DELETE CASCADE,
  is_hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comments viewable by all" ON public.comments FOR SELECT USING (is_hidden = false OR auth.uid() = user_id OR EXISTS (SELECT 1 FROM creator_profiles cp WHERE cp.id = comments.creator_id AND cp.user_id = auth.uid()));
CREATE POLICY "Users insert own comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own comments" ON public.comments FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Creators moderate own creator comments" ON public.comments FOR UPDATE
  USING (EXISTS (SELECT 1 FROM creator_profiles cp WHERE cp.id = comments.creator_id AND cp.user_id = auth.uid()));
CREATE INDEX idx_comments_parent ON public.comments(parent_type, parent_id);

-- ============ REACTIONS ============
CREATE TABLE public.reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  parent_type text NOT NULL, -- 'post' | 'file' | 'comment'
  parent_id uuid NOT NULL,
  emoji text NOT NULL DEFAULT '❤️',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, parent_type, parent_id, emoji)
);
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reactions viewable" ON public.reactions FOR SELECT USING (true);
CREATE POLICY "Users react" ON public.reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users unreact" ON public.reactions FOR DELETE USING (auth.uid() = user_id);

-- ============ DIRECT MESSAGES ============
CREATE TABLE public.dm_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
  member_user_id uuid NOT NULL,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(creator_id, member_user_id)
);
ALTER TABLE public.dm_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Thread participants view" ON public.dm_threads FOR SELECT
  USING (auth.uid() = member_user_id OR EXISTS (SELECT 1 FROM creator_profiles cp WHERE cp.id = dm_threads.creator_id AND cp.user_id = auth.uid()));
CREATE POLICY "Thread participants insert" ON public.dm_threads FOR INSERT
  WITH CHECK (auth.uid() = member_user_id OR EXISTS (SELECT 1 FROM creator_profiles cp WHERE cp.id = dm_threads.creator_id AND cp.user_id = auth.uid()));

CREATE TABLE public.dm_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.dm_threads(id) ON DELETE CASCADE,
  sender_user_id uuid NOT NULL,
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.dm_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants view messages" ON public.dm_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM dm_threads t WHERE t.id = dm_messages.thread_id AND (
      t.member_user_id = auth.uid() OR EXISTS (SELECT 1 FROM creator_profiles cp WHERE cp.id = t.creator_id AND cp.user_id = auth.uid())
    )
  ));
CREATE POLICY "Participants send messages" ON public.dm_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_user_id AND EXISTS (
      SELECT 1 FROM dm_threads t WHERE t.id = dm_messages.thread_id AND (
        t.member_user_id = auth.uid() OR EXISTS (SELECT 1 FROM creator_profiles cp WHERE cp.id = t.creator_id AND cp.user_id = auth.uid())
      )
    )
  );
CREATE POLICY "Mark own received as read" ON public.dm_messages FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM dm_threads t WHERE t.id = dm_messages.thread_id AND (
      t.member_user_id = auth.uid() OR EXISTS (SELECT 1 FROM creator_profiles cp WHERE cp.id = t.creator_id AND cp.user_id = auth.uid())
    )
  ));

-- ============ FILE EXTENSIONS: print metadata, drafts, schedule, version ============
ALTER TABLE public.creator_files
  ADD COLUMN IF NOT EXISTS print_time_minutes integer,
  ADD COLUMN IF NOT EXISTS material text,
  ADD COLUMN IF NOT EXISTS supports_required boolean,
  ADD COLUMN IF NOT EXISTS layer_height_mm numeric,
  ADD COLUMN IF NOT EXISTS infill_percent integer,
  ADD COLUMN IF NOT EXISTS recommended_printer text,
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft', -- draft | scheduled | published
  ADD COLUMN IF NOT EXISTS bundle_id uuid,
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;

CREATE TABLE public.file_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id uuid NOT NULL REFERENCES public.creator_files(id) ON DELETE CASCADE,
  version integer NOT NULL,
  file_url text NOT NULL,
  file_size bigint,
  changelog text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.file_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators manage own file versions" ON public.file_versions FOR ALL
  USING (EXISTS (SELECT 1 FROM creator_files f JOIN creator_profiles cp ON cp.id = f.creator_id WHERE f.id = file_versions.file_id AND cp.user_id = auth.uid()));
CREATE POLICY "Versions visible if file visible" ON public.file_versions FOR SELECT USING (true);

-- ============ BUNDLES ============
CREATE TABLE public.bundles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text NOT NULL,
  description text,
  cover_image_url text,
  is_published boolean NOT NULL DEFAULT false,
  tier_required_id uuid REFERENCES public.creator_tiers(id) ON DELETE SET NULL,
  is_free boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(creator_id, slug)
);
ALTER TABLE public.bundles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators manage bundles" ON public.bundles FOR ALL
  USING (EXISTS (SELECT 1 FROM creator_profiles cp WHERE cp.id = bundles.creator_id AND cp.user_id = auth.uid()));
CREATE POLICY "Published bundles viewable" ON public.bundles FOR SELECT USING (is_published OR EXISTS (SELECT 1 FROM creator_profiles cp WHERE cp.id = bundles.creator_id AND cp.user_id = auth.uid()));
CREATE TRIGGER tg_bundles_updated BEFORE UPDATE ON public.bundles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.bundle_files (
  bundle_id uuid NOT NULL REFERENCES public.bundles(id) ON DELETE CASCADE,
  file_id uuid NOT NULL REFERENCES public.creator_files(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  PRIMARY KEY (bundle_id, file_id)
);
ALTER TABLE public.bundle_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators manage bundle files" ON public.bundle_files FOR ALL
  USING (EXISTS (SELECT 1 FROM bundles b JOIN creator_profiles cp ON cp.id = b.creator_id WHERE b.id = bundle_files.bundle_id AND cp.user_id = auth.uid()));
CREATE POLICY "Bundle files viewable if bundle viewable" ON public.bundle_files FOR SELECT USING (true);

-- ============ PROMO CODES ============
CREATE TABLE public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
  code text NOT NULL,
  percent_off integer NOT NULL,
  max_uses integer,
  uses_count integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(creator_id, code)
);
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators manage promo codes" ON public.promo_codes FOR ALL
  USING (EXISTS (SELECT 1 FROM creator_profiles cp WHERE cp.id = promo_codes.creator_id AND cp.user_id = auth.uid()));

-- ============ WISHLIST + COLLECTIONS ============
CREATE TABLE public.wishlist (
  user_id uuid NOT NULL,
  file_id uuid NOT NULL REFERENCES public.creator_files(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, file_id)
);
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own wishlist" ON public.wishlist FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.user_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own collections" ON public.user_collections FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.collection_files (
  collection_id uuid NOT NULL REFERENCES public.user_collections(id) ON DELETE CASCADE,
  file_id uuid NOT NULL REFERENCES public.creator_files(id) ON DELETE CASCADE,
  PRIMARY KEY (collection_id, file_id)
);
ALTER TABLE public.collection_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own collection files" ON public.collection_files FOR ALL
  USING (EXISTS (SELECT 1 FROM user_collections c WHERE c.id = collection_files.collection_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM user_collections c WHERE c.id = collection_files.collection_id AND c.user_id = auth.uid()));

-- ============ NOTIFICATIONS ============
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users mark own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE INDEX idx_notif_user ON public.notifications(user_id, read_at);

CREATE TABLE public.notification_prefs (
  user_id uuid PRIMARY KEY,
  email_new_file boolean NOT NULL DEFAULT true,
  email_new_post boolean NOT NULL DEFAULT true,
  email_dm boolean NOT NULL DEFAULT true,
  email_weekly_digest boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notification_prefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own prefs" ON public.notification_prefs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ PRINT LOG ============
CREATE TABLE public.print_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  file_id uuid NOT NULL REFERENCES public.creator_files(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
  photo_url text,
  rating integer CHECK (rating BETWEEN 1 AND 5),
  notes text,
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.print_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public print log viewable" ON public.print_log FOR SELECT USING (is_public OR auth.uid() = user_id);
CREATE POLICY "Users manage own print log" ON public.print_log FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ GIFT SUBSCRIPTIONS ============
CREATE TABLE public.gift_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_user_id uuid NOT NULL,
  recipient_email text NOT NULL,
  recipient_user_id uuid,
  creator_id uuid NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
  tier_id uuid NOT NULL REFERENCES public.creator_tiers(id) ON DELETE CASCADE,
  months integer NOT NULL DEFAULT 1,
  redeem_code text NOT NULL UNIQUE,
  redeemed_at timestamptz,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.gift_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Buyer views own gifts" ON public.gift_subscriptions FOR SELECT USING (auth.uid() = buyer_user_id OR auth.uid() = recipient_user_id);
CREATE POLICY "Buyer creates gift" ON public.gift_subscriptions FOR INSERT WITH CHECK (auth.uid() = buyer_user_id);
CREATE POLICY "Recipient redeems" ON public.gift_subscriptions FOR UPDATE USING (auth.uid() = recipient_user_id OR auth.uid() = buyer_user_id);

-- ============ AUDIT LOG ============
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid,
  action text NOT NULL,
  target_type text,
  target_id text,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view audit log" ON public.audit_log FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Insert audit log" ON public.audit_log FOR INSERT WITH CHECK (true);

-- ============ FEATURED CREATORS ============
CREATE TABLE public.featured_creators (
  creator_id uuid PRIMARY KEY REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  featured_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.featured_creators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view featured" ON public.featured_creators FOR SELECT USING (true);
CREATE POLICY "Admins manage featured" ON public.featured_creators FOR ALL USING (has_role(auth.uid(), 'admin'));

-- ============ EMAIL BROADCASTS ============
CREATE TABLE public.broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audience text NOT NULL, -- all_members | all_creators | both
  subject text NOT NULL,
  body text NOT NULL,
  sent_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage broadcasts" ON public.broadcasts FOR ALL USING (has_role(auth.uid(), 'admin'));

-- ============ FEATURE FLAGS ============
CREATE TABLE public.feature_flags (
  key text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT false,
  description text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone read flags" ON public.feature_flags FOR SELECT USING (true);
CREATE POLICY "Admins manage flags" ON public.feature_flags FOR ALL USING (has_role(auth.uid(), 'admin'));

-- ============ SUPPORT TICKETS ============
CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  email text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  category text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone submit ticket" ON public.support_tickets FOR INSERT WITH CHECK (true);
CREATE POLICY "Users view own tickets" ON public.support_tickets FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage tickets" ON public.support_tickets FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- ============ BLOG POSTS ============
CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  excerpt text,
  body text NOT NULL,
  cover_image_url text,
  author_user_id uuid,
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published blog viewable" ON public.blog_posts FOR SELECT USING (is_published OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage blog" ON public.blog_posts FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE TRIGGER tg_blog_updated BEFORE UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ NEW STORAGE BUCKET for print log photos ============
INSERT INTO storage.buckets (id, name, public) VALUES ('print-log', 'print-log', true) ON CONFLICT DO NOTHING;
CREATE POLICY "Print log photos public" ON storage.objects FOR SELECT USING (bucket_id = 'print-log');
CREATE POLICY "Users upload own print log" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'print-log' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own print log" ON storage.objects FOR DELETE USING (bucket_id = 'print-log' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============ POST IMAGES BUCKET ============
INSERT INTO storage.buckets (id, name, public) VALUES ('post-media', 'post-media', true) ON CONFLICT DO NOTHING;
CREATE POLICY "Post media public" ON storage.objects FOR SELECT USING (bucket_id = 'post-media');
CREATE POLICY "Creators upload post media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'post-media' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Creators delete own post media" ON storage.objects FOR DELETE USING (bucket_id = 'post-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============ BLOG MEDIA BUCKET ============
INSERT INTO storage.buckets (id, name, public) VALUES ('blog-media', 'blog-media', true) ON CONFLICT DO NOTHING;
CREATE POLICY "Blog media public" ON storage.objects FOR SELECT USING (bucket_id = 'blog-media');
CREATE POLICY "Admins upload blog media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'blog-media' AND has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete blog media" ON storage.objects FOR DELETE USING (bucket_id = 'blog-media' AND has_role(auth.uid(), 'admin'));
