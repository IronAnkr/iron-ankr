-- Delta migration to align teams model with app expectations
set search_path to public, extensions;

-- 1) Ensure team_role has 'member'
do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_enum e on t.oid = e.enumtypid
    where t.typname = 'team_role' and e.enumlabel = 'member'
  ) then
    alter type public.team_role add value 'member';
  end if;
end $$;

-- 2) Add slug and updated_at to teams
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='teams' and column_name='slug'
  ) then
    alter table public.teams add column slug text;
    create unique index if not exists teams_slug_key on public.teams(slug);
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='teams' and column_name='updated_at'
  ) then
    alter table public.teams add column updated_at timestamptz not null default now();
  end if;
end $$;

-- Ensure update trigger exists
do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 't_teams_updated'
  ) then
    create trigger t_teams_updated
      before update on public.teams
      for each row execute procedure set_updated_at();
  end if;
end $$;

-- 3) Optional invited_at/joined_at on team_members
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='team_members' and column_name='invited_at'
  ) then
    alter table public.team_members add column invited_at timestamptz;
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='team_members' and column_name='joined_at'
  ) then
    alter table public.team_members add column joined_at timestamptz;
    update public.team_members set joined_at = coalesce(joined_at, added_at);
  end if;
end $$;

