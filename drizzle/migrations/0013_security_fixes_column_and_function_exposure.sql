-- 1. creator_files.file_url must never be readable through the Data API.
revoke select (file_url) on public.creator_files from anon, authenticated;

-- 2. creator_profiles payout/Stripe metadata is internal.
revoke select (connected_account_id, payout_status) on public.creator_profiles from anon, authenticated;

create or replace function public.my_payout_info()
returns table (connected_account_id text, payout_status text)
language sql
stable
security definer
set search_path = public
as $$
  select cp.connected_account_id, cp.payout_status
  from public.creator_profiles cp
  where cp.user_id = auth.uid()
  limit 1;
$$;

revoke all on function public.my_payout_info() from public, anon;
grant execute on function public.my_payout_info() to authenticated;

-- 3. Feature flags: signed-in users only.
drop policy if exists "Anyone read flags" on public.feature_flags;
create policy "Authenticated read flags"
  on public.feature_flags for select to authenticated
  using (true);

-- 4. Comments must reference a real parent owned by the claimed creator.
create or replace function public.comment_parent_matches(
  _parent_type text, _parent_id uuid, _creator_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case _parent_type
    when 'file' then exists (
      select 1 from public.creator_files f
      where f.id = _parent_id and f.creator_id = _creator_id and f.is_published = true)
    when 'post' then exists (
      select 1 from public.creator_posts p
      where p.id = _parent_id and p.creator_id = _creator_id)
    when 'bundle' then exists (
      select 1 from public.bundles b
      where b.id = _parent_id and b.creator_id = _creator_id and b.is_published = true)
    else false
  end;
$$;

revoke all on function public.comment_parent_matches(text, uuid, uuid) from public, anon;
grant execute on function public.comment_parent_matches(text, uuid, uuid) to authenticated;

drop policy if exists "Users insert own comments" on public.comments;
create policy "Users insert own valid comments"
  on public.comments for insert to authenticated
  with check (
    auth.uid() = user_id
    and public.comment_parent_matches(parent_type, parent_id, creator_id)
  );

-- 5. post-media objects follow the audience rules of the post that uses them.
drop policy if exists "Post media public" on storage.objects;
create policy "Post media follows post audience"
  on storage.objects for select
  using (
    bucket_id = 'post-media'
    and (
      (auth.uid())::text = (storage.foldername(name))[1]
      or public.has_role(auth.uid(), 'admin')
      or exists (
        select 1
        from public.creator_posts p
        where p.cover_image_url like '%' || storage.objects.name
          and p.status = 'published'
          and (
            p.audience = 'everyone'
            or (p.audience = 'followers' and exists (
              select 1 from public.followers f
              where f.creator_id = p.creator_id and f.user_id = auth.uid()))
            or (p.audience in ('subscribers','tier') and exists (
              select 1 from public.subscriptions s
              where s.creator_id = p.creator_id
                and s.user_id = auth.uid()
                and s.status in ('active','trialing')
                and (p.tier_id is null or s.tier_id = p.tier_id)))
          )
      )
    )
  );

-- 6. Internal SECURITY DEFINER helpers must not be callable from the API.
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.beta_preregistrations_set_defaults() from public, anon, authenticated;
revoke all on function public.generate_beta_referral_code() from public, anon, authenticated;