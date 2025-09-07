-- This migration fixes a critical bug where a user's role in `app_users` was
-- being overwritten on every login. The `handle_auth_user_update` trigger was
-- aggressively syncing the role from `auth.users.raw_user_meta_data`, which
-- is often not set, causing the role to be reset to the default ('user').

-- The updated function ONLY syncs the email address, leaving the `role` column
-- untouched during login/update events. This makes the `app_users` table the
-- source of truth for application-level roles, as it should be.

create or replace function public.handle_auth_user_update()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.app_users
     set email = new.email,
         updated_at = now()
   where id = new.id;
  return new;
end;
$$;
