-- Seed initial admin settings keys with sensible defaults
insert into public.settings (key, scope, group_key, label, description, value, value_str, is_public, active)
values
  ('site.store_name', 'site', 'store', 'Store name', 'Displayed site-wide in titles and emails', null, 'Iron ankr', true, true),
  ('site.support_email', 'site', 'store', 'Support email', 'Primary support contact for customers', null, 'support@iron-ankr.com', false, true),
  ('shipping.domestic_flat_cents', 'shipping', 'rates', 'Domestic flat rate (cents)', 'Default domestic shipping price in cents', jsonb_build_object('cents', 500), null, false, true),
  ('shipping.international_flat_cents', 'shipping', 'rates', 'International flat rate (cents)', 'Default international shipping price in cents', jsonb_build_object('cents', 1500), null, false, true),
  ('theme.accent', 'theme', 'brand', 'Theme accent color', 'Primary accent used in UI', null, '#66E3FF', true, true)
on conflict (key) do nothing;

