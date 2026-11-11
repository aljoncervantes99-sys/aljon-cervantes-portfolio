-- SmartLogix AI Stage 2.1 - Auth/profile lifecycle and access hardening (REVIEW ONLY)
-- Status: generated for review; DO NOT EXECUTE/APPLY without explicit approval.
-- Depends on: 20261110235025_smartlogix_stage2.sql
-- Addresses: Supabase auth/profile synchronization, account suspension/removal handling,
-- restricted co-member profile visibility, and RLS checks for membership + account status.

begin;

-- 1) Profile lifecycle fields (safe sync with auth.users)
alter table public.profiles
  add column if not exists auth_email_confirmed_at timestamptz,
  add column if not exists suspended_at timestamptz,
  add column if not exists suspension_reason text,
  add column if not exists last_sign_in_at timestamptz,
  add column if not exists deactivated_at timestamptz;

-- Keep is_active as effective app-active flag; suspended/deactivated/deleted accounts must not access org data.

-- 2) Auth.users -> profiles synchronization (proposed; requires privileges on auth schema in Supabase SQL editor)
create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, display_name, auth_email_confirmed_at, created_at, updated_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email_confirmed_at,
    now(),
    now()
  )
  on conflict (id) do update
    set email = excluded.email,
        auth_email_confirmed_at = excluded.auth_email_confirmed_at,
        updated_at = now(),
        deleted_at = null,
        deactivated_at = null;
  return new;
end;
$$;

create or replace function public.handle_auth_user_updated()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set email = new.email,
      auth_email_confirmed_at = new.email_confirmed_at,
      last_sign_in_at = coalesce(new.last_sign_in_at, last_sign_in_at),
      -- if auth user is banned/disabled upstream, reflect suspension defensively (implementation-specific)
      updated_at = now()
  where id = new.id;
  return new;
end;
$$;

-- Proposed triggers (review before apply in Supabase; may require running as postgres/supabase_admin):
-- drop trigger if exists on_auth_user_created on auth.users;
-- create trigger on_auth_user_created after insert on auth.users
--   for each row execute function public.handle_auth_user_created();
-- drop trigger if exists on_auth_user_updated on auth.users;
-- create trigger on_auth_user_updated after update on auth.users
--   for each row execute function public.handle_auth_user_updated();

-- 3) Account/membership status helpers
create or replace function public.is_profile_active(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = p_user_id
      and p.is_active = true
      and p.deleted_at is null
      and p.deactivated_at is null
      and p.suspended_at is null
  );
$$;

create or replace function public.is_org_member(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_profile_active(auth.uid())
    and exists (
      select 1
      from public.organization_members m
      join public.profiles p on p.id = m.user_id
      where m.organization_id = p_org_id
        and m.user_id = auth.uid()
        and m.status = 'active'
        and m.deleted_at is null
        and p.is_active = true
        and p.deleted_at is null
        and p.deactivated_at is null
        and p.suspended_at is null
    );
$$;

create or replace function public.has_org_role(p_org_id uuid, p_roles public.member_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_profile_active(auth.uid())
    and exists (
      select 1
      from public.organization_members m
      join public.profiles p on p.id = m.user_id
      where m.organization_id = p_org_id
        and m.user_id = auth.uid()
        and m.status = 'active'
        and m.deleted_at is null
        and m.role = any(p_roles)
        and p.is_active = true
        and p.deleted_at is null
        and p.deactivated_at is null
        and p.suspended_at is null
    );
$$;

-- 4) Restrict co-member profile visibility to necessary business information
-- Replace broad co-member select with: self, or owner/admin of shared org for admin needs.
-- Other active members access limited fields via directory view below.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
for select using (
  id = auth.uid()
  or exists (
    select 1
    from public.organization_members m_target
    join public.organization_members m_self
      on m_self.organization_id = m_target.organization_id
    where m_target.user_id = profiles.id
      and m_target.status = 'active' and m_target.deleted_at is null
      and m_self.user_id = auth.uid()
      and m_self.status = 'active' and m_self.deleted_at is null
      and m_self.role in ('owner','admin')
      and public.is_profile_active(auth.uid())
  )
);

-- Limited business directory for active co-members (no email/phone/preferences/suspension details)
create or replace view public.organization_member_directory as
select
  m.organization_id,
  m.user_id,
  p.display_name,
  coalesce(p.full_name, p.display_name) as business_name,
  p.avatar_url,
  m.role,
  m.status as membership_status,
  m.joined_at
from public.organization_members m
join public.profiles p on p.id = m.user_id
where m.status = 'active'
  and m.deleted_at is null
  and p.is_active = true
  and p.deleted_at is null
  and p.deactivated_at is null
  and p.suspended_at is null;

-- View access: only active, non-suspended members of the same organization
alter view public.organization_member_directory set (security_invoker = true);
-- If security_invoker not desired in target Postgres/Supabase version, replace with SECURITY DEFINER function returning filtered rows.

-- Revoke broad access and grant minimally (adjust roles as needed for Supabase: authenticated)
revoke all on public.organization_member_directory from anon;
grant select on public.organization_member_directory to authenticated;

-- Ensure base profiles table is not broadly readable beyond RLS; no additional grants added here.

-- 5) Membership removal/suspension safeguards
-- When a member is removed/suspended at org level, RLS helpers already deny access.
-- When profile is suspended/deactivated/deleted, helpers deny access across all orgs.
create or replace function public.prevent_last_owner_removal()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_count integer;
begin
  if (tg_op = 'UPDATE') then
    if old.role = 'owner' and old.status = 'active' and old.deleted_at is null
       and (new.role <> 'owner' or new.status <> 'active' or new.deleted_at is not null) then
      select count(*) into v_owner_count
      from public.organization_members m
      where m.organization_id = old.organization_id
        and m.role = 'owner' and m.status = 'active' and m.deleted_at is null
        and m.id <> old.id;
      if v_owner_count = 0 then
        raise exception 'cannot_remove_last_owner';
      end if;
    end if;
  elsif (tg_op = 'DELETE') then
    if old.role = 'owner' and old.status = 'active' and old.deleted_at is null then
      select count(*) into v_owner_count
      from public.organization_members m
      where m.organization_id = old.organization_id
        and m.role = 'owner' and m.status = 'active' and m.deleted_at is null
        and m.id <> old.id;
      if v_owner_count = 0 then
        raise exception 'cannot_remove_last_owner';
      end if;
    end if;
  end if;
  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;

drop trigger if exists organization_members_prevent_last_owner_removal on public.organization_members;
create trigger organization_members_prevent_last_owner_removal
before update or delete on public.organization_members
for each row execute function public.prevent_last_owner_removal();

commit;