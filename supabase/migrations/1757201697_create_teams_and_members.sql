-- migrate:up

-- be explicit about schema search path
set search_path to public, extensions;

-- 1) Team-scoped role enum
do $$
begin
  create type public.team_role as enum ('owner','admin','marketing');
exception
  when duplicate_object then null;
end $$;

-- 2) Teams
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- 3) Team members
create table if not exists public.team_members (
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.team_role not null,
  added_at timestamptz not null default now(),
  primary key (team_id, user_id)
);

create unique index if not exists team_one_owner_per_team
  on public.team_members(team_id)
  where role = 'owner';

create index if not exists idx_team_members_user_id on public.team_members(user_id);
create index if not exists idx_team_members_role on public.team_members(role);

-- 4) Team invitations
create table if not exists public.team_invites (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  email text not null,
  role public.team_role not null,
  token text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);

create index if not exists idx_team_invites_team_id on public.team_invites(team_id);
create index if not exists idx_team_invites_email on public.team_invites(email);

-- 5) Product change log (accountability)
-- Create the table WITHOUT FK first (so the migration doesn't fail if products isn't there yet)
create table if not exists public.product_audits (
  id bigint generated always as identity primary key,
  product_id uuid not null,
  actor uuid not null references auth.users(id),
  action text not null, -- 'create','update','price_change','hide','restore'
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_product_audits_product_id on public.product_audits(product_id);
create index if not exists idx_product_audits_actor on public.product_audits(actor);
create index if not exists idx_product_audits_created_at on public.product_audits(created_at);

-- Conditionally add the FK to products if that table exists
do $$
begin
  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where c.relkind = 'r'
      and c.relname = 'products'
      and n.nspname = 'public'
  ) then
    -- add only if not already present
    if not exists (
      select 1
      from pg_constraint
      where conname = 'product_audits_product_id_fkey'
    ) then
      alter table public.product_audits
        add constraint product_audits_product_id_fkey
        foreign key (product_id) references public.products(id) on delete cascade;
    end if;
  end if;
end $$;

-- 6) Inventory ledger (stock keeping)
create table if not exists public.inventory_ledger (
  id bigint generated always as identity primary key,
  sku text not null,
  delta int not null,
  reason text not null, -- 'purchase','refund','manual_adjust','correction'
  order_id uuid,
  actor uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_inventory_ledger_sku on public.inventory_ledger(sku);
create index if not exists idx_inventory_ledger_order_id on public.inventory_ledger(order_id);
create index if not exists idx_inventory_ledger_actor on public.inventory_ledger(actor);
create index if not exists idx_inventory_ledger_created_at on public.inventory_ledger(created_at);

-- 7) Campaigns
create table if not exists public.marketing_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  channel text not null, -- 'email','sms','organic','influencer','ads'
  budget_cents int default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  status text not null default 'draft', -- 'draft','live','paused','done'
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  constraint marketing_campaigns_status_chk
    check (status in ('draft','live','paused','done'))
);

create index if not exists idx_marketing_campaigns_channel on public.marketing_campaigns(channel);
create index if not exists idx_marketing_campaigns_status on public.marketing_campaigns(status);
create index if not exists idx_marketing_campaigns_dates on public.marketing_campaigns(starts_at, ends_at);

-- 8) Short links with auto-UTM
create table if not exists public.marketing_links (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  destination text not null,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  owned_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  clicks int not null default 0
);

create index if not exists idx_marketing_links_owned_by on public.marketing_links(owned_by);
create index if not exists idx_marketing_links_created_at on public.marketing_links(created_at);

-- 9) Click events
create table if not exists public.link_click_events (
  id bigint generated always as identity primary key,
  link_id uuid not null references public.marketing_links(id) on delete cascade,
  ts timestamptz not null default now(),
  ip inet,
  ua text,
  referrer text
);

create index if not exists idx_link_click_events_link_id on public.link_click_events(link_id);
create index if not exists idx_link_click_events_ts on public.link_click_events(ts);

-- 10) Content calendar
create table if not exists public.content_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  platform text not null, -- 'site','blog','ig','tiktok','yt','email'
  status text not null default 'planned', -- 'planned','draft','scheduled','published'
  publish_at timestamptz,
  url text,
  campaign_id uuid references public.marketing_campaigns(id),
  owner uuid references auth.users(id),
  created_at timestamptz not null default now(),
  constraint content_posts_status_chk
    check (status in ('planned','draft','scheduled','published'))
);

create index if not exists idx_content_posts_platform on public.content_posts(platform);
create index if not exists idx_content_posts_status on public.content_posts(status);
create index if not exists idx_content_posts_publish_at on public.content_posts(publish_at);
create index if not exists idx_content_posts_campaign_id on public.content_posts(campaign_id);

-- 11) Affiliates
create table if not exists public.affiliates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact text,
  default_commission_bp int not null default 1000, -- 10.00% in basis points
  coupon_code text unique,
  link_id uuid references public.marketing_links(id),
  created_at timestamptz not null default now(),
  active boolean not null default true
);

create index if not exists idx_affiliates_active on public.affiliates(active);
create index if not exists idx_affiliates_link_id on public.affiliates(link_id);

