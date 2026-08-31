-- 1. profiles: stop exposing every user's email/name publicly
drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Users and admins can view profiles"
  on public.profiles for select
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

-- 2. creator_files: keep browsable metadata public, but never expose the
-- storage path (file_url) to the Data API. Downloads/previews are issued
-- server-side via signed URLs.
revoke select on public.creator_files from anon, authenticated;
grant select (
  id, creator_id, title, slug, description, file_type, file_size, preview_images,
  tags, category, tier_required_id, is_free, is_published, download_count,
  created_at, updated_at, print_time_minutes, material, supports_required,
  layer_height_mm, infill_percent, recommended_printer, scheduled_at, status,
  bundle_id, version, takedown_at, takedown_reason, dim_x, dim_y, dim_z, triangle_count
) on public.creator_files to anon, authenticated;
grant all on public.creator_files to service_role;

-- 3. file_versions: owner/admin only (was USING (true))
drop policy if exists "Versions visible if file visible" on public.file_versions;
create policy "Owners and admins view file versions"
  on public.file_versions for select
  using (
    public.has_role(auth.uid(), 'admin')
    or exists (
      select 1 from public.creator_files f
      join public.creator_profiles cp on cp.id = f.creator_id
      where f.id = file_versions.file_id and cp.user_id = auth.uid()
    )
  );

-- 4. bundle_files: only when the parent bundle is actually viewable
drop policy if exists "Bundle files viewable if bundle viewable" on public.bundle_files;
create policy "Bundle files follow bundle visibility"
  on public.bundle_files for select
  using (
    exists (
      select 1 from public.bundles b
      left join public.creator_profiles cp on cp.id = b.creator_id
      where b.id = bundle_files.bundle_id
        and (b.is_published = true or cp.user_id = auth.uid() or public.has_role(auth.uid(), 'admin'))
    )
  );

-- 5. invite_codes: no public enumeration; validation happens through an RPC
drop policy if exists "Public can read invite by code" on public.invite_codes;

create or replace function public.check_invite_code(p_code text)
returns table (valid boolean, reason text)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  rec public.invite_codes%rowtype;
begin
  select * into rec from public.invite_codes where code = p_code limit 1;
  if not found then
    return query select false, 'Invite code not found.'; return;
  end if;
  if rec.status <> 'active' then
    return query select false, format('This invite is %s.', rec.status); return;
  end if;
  if rec.expires_at is not null and rec.expires_at < now() then
    return query select false, 'This invite has expired.'; return;
  end if;
  if rec.uses >= rec.max_uses then
    return query select false, 'This invite has been used.'; return;
  end if;
  return query select true, null::text;
end;
$$;

revoke all on function public.check_invite_code(text) from public;
grant execute on function public.check_invite_code(text) to anon, authenticated;

-- 6. storage: scope owner deletes to the buckets they actually own
drop policy if exists "Owners delete own storage" on storage.objects;
create policy "Owners delete own storage"
  on storage.objects for delete
  using (
    bucket_id in ('files','previews','avatars','banners','post-media','print-log')
    and (auth.uid())::text = (storage.foldername(name))[1]
  );