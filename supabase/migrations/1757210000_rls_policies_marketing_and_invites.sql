-- Helper: get user email from app_users
create or replace function public.app_user_email(p_user uuid)
returns text
language sql
security definer set search_path = public
as $$
  select email from public.app_users where id = p_user;
$$;

-- Helper: is site admin/owner
create or replace function public.is_site_admin(p_user uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.app_users where id = p_user and role in ('admin','owner')
  );
$$;

-- Helper: is team owner for a team
create or replace function public.is_team_owner(p_user uuid, p_team uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.team_members tm
    where tm.user_id = p_user and tm.team_id = p_team and tm.role = 'owner'
  );
$$;

-- Helper: is marketing member/admin (by team slug/name = 'marketing')
create or replace function public.is_marketing_member(p_user uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1
    from public.team_members tm
    join public.teams t on t.id = tm.team_id
    where tm.user_id = p_user
      and (t.slug = 'marketing' or lower(t.name) = 'marketing')
      and tm.role in ('marketing','admin','owner')
  ) or public.is_site_admin(p_user);
$$;

create or replace function public.is_marketing_admin(p_user uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select public.is_site_admin(p_user) or exists (
    select 1
    from public.team_members tm
    join public.teams t on t.id = tm.team_id
    where tm.user_id = p_user
      and (t.slug = 'marketing' or lower(t.name) = 'marketing')
      and tm.role in ('admin','owner')
  );
$$;

-- Team invites: allow invitee to manage their invites
alter table public.team_invites enable row level security;

drop policy if exists invitee_select on public.team_invites;
create policy invitee_select on public.team_invites
for select
to authenticated
using ( lower(email) = lower(public.app_user_email(auth.uid())) );

drop policy if exists invitee_update on public.team_invites;
create policy invitee_update on public.team_invites
for update
to authenticated
using ( lower(email) = lower(public.app_user_email(auth.uid())) );

drop policy if exists invitee_delete on public.team_invites;
create policy invitee_delete on public.team_invites
for delete
to authenticated
using ( lower(email) = lower(public.app_user_email(auth.uid())) );

-- Allow creating invites via application server checks (owner/team owner). Keep broad insert but rely on API authz.
drop policy if exists inviter_insert on public.team_invites;
create policy inviter_insert on public.team_invites
for insert
to authenticated
with check ( true );

-- Team members: allow accepting invite (insert) when a valid invite exists
alter table public.team_members enable row level security;

drop policy if exists accept_invite_insert on public.team_members;
create policy accept_invite_insert on public.team_members
for insert
to authenticated
with check (
  exists (
    select 1 from public.team_invites ti
    where ti.team_id = team_members.team_id
      and ti.accepted_at is null
      and ti.expires_at > now()
      and lower(ti.email) = lower(public.app_user_email(auth.uid()))
  )
);

-- Allow select memberships for own user
drop policy if exists member_select_self on public.team_members;
create policy member_select_self on public.team_members
for select to authenticated
using ( user_id = auth.uid() );

-- Banner messages: enable anonymous read of active banners; marketing member/admin can write.
alter table public.banner_messages enable row level security;

drop policy if exists anon_read_banners on public.banner_messages;
create policy anon_read_banners on public.banner_messages
for select to anon
using ( active = true );

drop policy if exists member_read_banners on public.banner_messages;
create policy member_read_banners on public.banner_messages
for select to authenticated
using ( true );

drop policy if exists member_insert_banners on public.banner_messages;
create policy member_insert_banners on public.banner_messages
for insert to authenticated
with check ( public.is_marketing_member(auth.uid()) );

drop policy if exists admin_update_banners on public.banner_messages;
create policy admin_update_banners on public.banner_messages
for update to authenticated
using ( public.is_marketing_admin(auth.uid()) )
with check ( public.is_marketing_admin(auth.uid()) );

drop policy if exists admin_delete_banners on public.banner_messages;
create policy admin_delete_banners on public.banner_messages
for delete to authenticated
using ( public.is_marketing_admin(auth.uid()) );

-- Marketing tables RLS moved to 1757210200_fix_rls_policy_create.sql to avoid invalid IF NOT EXISTS
