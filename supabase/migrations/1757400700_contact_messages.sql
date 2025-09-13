-- Contact messages submitted from the public contact form

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  user_id uuid references auth.users(id) on delete set null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- Helpful indexes
create index if not exists idx_contact_messages_created_at on public.contact_messages(created_at desc);
create index if not exists idx_contact_messages_email on public.contact_messages(email);

-- RLS policies
alter table public.contact_messages enable row level security;

-- Public/anon may create messages
drop policy if exists contact_messages_insert_public on public.contact_messages;
create policy contact_messages_insert_public on public.contact_messages
for insert to anon, authenticated
with check ( true );

-- Admins/owners can read
drop policy if exists contact_messages_admin_select on public.contact_messages;
create policy contact_messages_admin_select on public.contact_messages
for select to authenticated
using ( public.is_site_admin(auth.uid()) );

-- Admins/owners can update/delete (e.g., mark handled)
drop policy if exists contact_messages_admin_update on public.contact_messages;
create policy contact_messages_admin_update on public.contact_messages
for update to authenticated
using ( public.is_site_admin(auth.uid()) )
with check ( public.is_site_admin(auth.uid()) );

drop policy if exists contact_messages_admin_delete on public.contact_messages;
create policy contact_messages_admin_delete on public.contact_messages
for delete to authenticated
using ( public.is_site_admin(auth.uid()) );

