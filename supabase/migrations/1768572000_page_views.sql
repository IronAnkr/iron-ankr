-- Page views analytics table
-- Tracks start/end timestamps with basic device and request info

create table if not exists page_views (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references app_users(id) on delete set null,
  device_id text,
  fingerprint text,
  ip text,
  user_agent text,
  referrer text,
  page_url text,
  path text,
  search text,
  title text,
  language text,
  timezone text,
  viewport jsonb,
  screen jsonb,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_page_views_started_at on page_views(started_at);
create index if not exists idx_page_views_path on page_views(path);
create index if not exists idx_page_views_user_id on page_views(user_id);
create index if not exists idx_page_views_device_id on page_views(device_id);

create trigger t_page_views_updated
  before update on page_views
  for each row execute procedure set_updated_at();

