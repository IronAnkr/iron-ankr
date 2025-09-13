-- Add handled fields to contact_messages and supporting indexes

alter table public.contact_messages
  add column if not exists handled boolean not null default false,
  add column if not exists handled_by uuid references auth.users(id) on delete set null,
  add column if not exists handled_at timestamptz;

create index if not exists idx_contact_messages_handled on public.contact_messages(handled);
create index if not exists idx_contact_messages_handled_at on public.contact_messages(handled_at desc);

