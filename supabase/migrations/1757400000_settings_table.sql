-- Admin site settings table
-- Flexible key/value configuration with scoping and public exposure controls

-- Table: settings
create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  scope text not null default 'site',                 -- logical area: site, checkout, emails, seo, marketing, theme, features, etc.
  group_key text,                                     -- optional grouping/category
  label text,
  description text,
  value jsonb,                                        -- canonical value container
  value_str text,                                     -- convenience for simple string values
  is_public boolean not null default false,           -- can be read by anon clients
  active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Useful indexes
create index if not exists idx_settings_scope on public.settings(scope);
create index if not exists idx_settings_active on public.settings(active);
create index if not exists idx_settings_public on public.settings(is_public);
create index if not exists idx_settings_window on public.settings((coalesce(starts_at, '-infinity'::timestamptz)), (coalesce(ends_at, 'infinity'::timestamptz)));

-- updated_at trigger
create trigger t_settings_updated
  before update on public.settings
  for each row execute procedure public.set_updated_at();

-- RLS policies
alter table public.settings enable row level security;

-- Anonymous/public read for active, in-window settings
drop policy if exists settings_anon_read on public.settings;
create policy settings_anon_read on public.settings
for select to anon
using (
  is_public = true
  and active = true
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at >= now())
);

-- Admin full access
drop policy if exists settings_admin_select on public.settings;
create policy settings_admin_select on public.settings
for select to authenticated
using ( public.is_site_admin(auth.uid()) );

drop policy if exists settings_admin_insert on public.settings;
create policy settings_admin_insert on public.settings
for insert to authenticated
with check ( public.is_site_admin(auth.uid()) );

drop policy if exists settings_admin_update on public.settings;
create policy settings_admin_update on public.settings
for update to authenticated
using ( public.is_site_admin(auth.uid()) )
with check ( public.is_site_admin(auth.uid()) );

drop policy if exists settings_admin_delete on public.settings;
create policy settings_admin_delete on public.settings
for delete to authenticated
using ( public.is_site_admin(auth.uid()) );

