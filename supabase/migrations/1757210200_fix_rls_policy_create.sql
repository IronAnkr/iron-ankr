-- Fix invalid "create policy if not exists" usage by recreating policies

-- Marketing Links
alter table public.marketing_links enable row level security;
drop policy if exists ml_select on public.marketing_links;
create policy ml_select on public.marketing_links for select to authenticated using ( public.is_marketing_member(auth.uid()) );
drop policy if exists ml_insert on public.marketing_links;
create policy ml_insert on public.marketing_links for insert to authenticated with check ( public.is_marketing_member(auth.uid()) );
drop policy if exists ml_update on public.marketing_links;
create policy ml_update on public.marketing_links for update to authenticated using ( public.is_marketing_admin(auth.uid()) ) with check ( public.is_marketing_admin(auth.uid()) );
drop policy if exists ml_delete on public.marketing_links;
create policy ml_delete on public.marketing_links for delete to authenticated using ( public.is_marketing_admin(auth.uid()) );

-- Marketing Campaigns
alter table public.marketing_campaigns enable row level security;
drop policy if exists mc_select on public.marketing_campaigns;
create policy mc_select on public.marketing_campaigns for select to authenticated using ( public.is_marketing_member(auth.uid()) );
drop policy if exists mc_insert on public.marketing_campaigns;
create policy mc_insert on public.marketing_campaigns for insert to authenticated with check ( public.is_marketing_member(auth.uid()) );
drop policy if exists mc_update on public.marketing_campaigns;
create policy mc_update on public.marketing_campaigns for update to authenticated using ( public.is_marketing_admin(auth.uid()) ) with check ( public.is_marketing_admin(auth.uid()) );
drop policy if exists mc_delete on public.marketing_campaigns;
create policy mc_delete on public.marketing_campaigns for delete to authenticated using ( public.is_marketing_admin(auth.uid()) );

-- Content Posts
alter table public.content_posts enable row level security;
drop policy if exists cp_select on public.content_posts;
create policy cp_select on public.content_posts for select to authenticated using ( public.is_marketing_member(auth.uid()) );
drop policy if exists cp_insert on public.content_posts;
create policy cp_insert on public.content_posts for insert to authenticated with check ( public.is_marketing_member(auth.uid()) );
drop policy if exists cp_update on public.content_posts;
create policy cp_update on public.content_posts for update to authenticated using ( public.is_marketing_admin(auth.uid()) ) with check ( public.is_marketing_admin(auth.uid()) );
drop policy if exists cp_delete on public.content_posts;
create policy cp_delete on public.content_posts for delete to authenticated using ( public.is_marketing_admin(auth.uid()) );

-- Link Click Events: allow inserts from anon
alter table public.link_click_events enable row level security;
drop policy if exists lce_insert on public.link_click_events;
create policy lce_insert on public.link_click_events for insert to anon with check ( true );
