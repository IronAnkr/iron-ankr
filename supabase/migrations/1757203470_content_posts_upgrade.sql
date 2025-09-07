-- migrate:up

-- Enums (idempotent)
do $$ begin
  create type content_platform as enum ('site','blog','ig','tiktok','yt','email','x','fb','pin','reddit');
exception when duplicate_object then null; end $$;

do $$ begin
  create type content_status as enum ('planned','draft','scheduled','published','failed');
exception when duplicate_object then null; end $$;

-- 0) Drop defaults so they don't interfere
alter table public.content_posts
  alter column status drop default;
alter table public.content_posts
  alter column platform drop default;

-- 1) Drop any old CHECK constraints that reference status as text
alter table public.content_posts
  drop constraint if exists content_posts_status_chk;

-- 2) Convert text -> enum using explicit CASE mapping
alter table public.content_posts
  alter column platform type content_platform
  using (
    case lower(platform)
      when 'site'    then 'site'::content_platform
      when 'blog'    then 'blog'::content_platform
      when 'ig'      then 'ig'::content_platform
      when 'tiktok'  then 'tiktok'::content_platform
      when 'yt'      then 'yt'::content_platform
      when 'email'   then 'email'::content_platform
      when 'x'       then 'x'::content_platform
      when 'fb'      then 'fb'::content_platform
      when 'pin'     then 'pin'::content_platform
      when 'reddit'  then 'reddit'::content_platform
      else 'site'::content_platform
    end
  );

alter table public.content_posts
  alter column status type content_status
  using (
    case lower(status)
      when 'planned'   then 'planned'::content_status
      when 'draft'     then 'draft'::content_status
      when 'scheduled' then 'scheduled'::content_status
      when 'published' then 'published'::content_status
      when 'failed'    then 'failed'::content_status
      else 'planned'::content_status
    end
  );

-- 3) Reinstate an enum default
alter table public.content_posts
  alter column status set default 'planned'::content_status;


-- migrate:down

-- Convert back to text, then restore a text default
alter table public.content_posts
  alter column status drop default,
  alter column status type text using status::text,
  alter column platform type text using platform::text;

alter table public.content_posts
  alter column status set default 'planned';

-- Optionally recreate the old CHECK (not required)
-- alter table public.content_posts
--   add constraint content_posts_status_chk
--   check (status in ('planned','draft','scheduled','published','failed'));

-- Drop enums only if nothing depends on them
do $$ begin
  if exists (select 1 from pg_type where typname = 'content_status') then
    drop type content_status;
  end if;
  if exists (select 1 from pg_type where typname = 'content_platform') then
    drop type content_platform;
  end if;
end $$;

