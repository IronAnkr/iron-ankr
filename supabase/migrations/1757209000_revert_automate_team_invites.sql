-- Revert automation added in 1757205200_automate_team_invites.sql
-- - Remove auto-acceptance of team invites on auth events
-- - Restore handle_auth_user_* functions to prior behavior

-- 1) Drop the invite automation helper
drop function if exists public.accept_pending_invites_for_user(uuid, text);

-- 2) Restore INSERT trigger function: create app_users row and sync role from raw metadata on initial insert
create or replace function public.handle_auth_user_insert()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.app_users (id, email, role)
  values (
    new.id,
    new.email,
    public._coerce_user_role( (new.raw_user_meta_data ->> 'role') )
  )
  on conflict (id) do update
    set email = excluded.email,
        role  = excluded.role,
        updated_at = now();
  return new;
end;
$$;

-- 3) Restore UPDATE trigger function: only sync email (do not overwrite role)
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

