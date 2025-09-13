-- Broaden anon read to public scopes (legal, site, shipping)
-- Keeps active/window gating; admin retains full access.

-- Update anon/public read policy to allow select on specific scopes
drop policy if exists settings_anon_read on public.settings;
create policy settings_anon_read on public.settings
for select to anon, authenticated
using (
  (
    is_public = true
    or scope in ('legal', 'site', 'shipping')
  )
  and active = true
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at >= now())
);
