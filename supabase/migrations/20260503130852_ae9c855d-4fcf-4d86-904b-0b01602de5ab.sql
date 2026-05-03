
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname IN (
    'Public read avatars','Users upload own avatar','Users update own avatar','Users delete own avatar',
    'Public read banners','Users upload own banner','Users update own banner','Users delete own banner',
    'Public read previews','Creators upload preview','Creators update preview','Creators delete preview',
    'Creators upload own files','Creators read own raw files','Creators update own files','Creators delete own files'
  ) LOOP
    EXECUTE format('DROP POLICY %I ON storage.objects', p.policyname);
  END LOOP;
END $$;

CREATE POLICY "Public read avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users upload own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own avatar" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public read banners" ON storage.objects FOR SELECT USING (bucket_id = 'banners');
CREATE POLICY "Users upload own banner" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'banners' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own banner" ON storage.objects FOR UPDATE USING (bucket_id = 'banners' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own banner" ON storage.objects FOR DELETE USING (bucket_id = 'banners' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public read previews" ON storage.objects FOR SELECT USING (bucket_id = 'previews');
CREATE POLICY "Creators upload preview" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'previews' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Creators update preview" ON storage.objects FOR UPDATE USING (bucket_id = 'previews' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Creators delete preview" ON storage.objects FOR DELETE USING (bucket_id = 'previews' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Creators upload own files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Creators read own raw files" ON storage.objects FOR SELECT USING (bucket_id = 'files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Creators update own files" ON storage.objects FOR UPDATE USING (bucket_id = 'files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Creators delete own files" ON storage.objects FOR DELETE USING (bucket_id = 'files' AND auth.uid()::text = (storage.foldername(name))[1]);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_roles' AND policyname='Users assign self creator role') THEN
    CREATE POLICY "Users assign self creator role" ON public.user_roles FOR INSERT WITH CHECK (auth.uid() = user_id AND role = 'creator');
  END IF;
END $$;
