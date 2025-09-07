-- Keep app_users in sync with Supabase auth.users
-- Inserts a row on user registration and updates email/role on profile changes.

-- Helper: coerce text to user_role enum with fallback
create or replace function public._coerce_user_role(role_text text)
returns user_role
language sql
immutable
as $$
  select case lower(coalesce(role_text, ''))
           when 'admin' then 'admin'::user_role
           else 'user'::user_role
         end;
$$;

-- On insert to auth.users, create an app_users row
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

-- On update to auth.users, keep email/role in sync
create or replace function public.handle_auth_user_update()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.app_users
     set email = new.email,
         role  = public._coerce_user_role( (new.raw_user_meta_data ->> 'role') ),
         updated_at = now()
   where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_insert on auth.users;
create trigger on_auth_user_insert
  after insert on auth.users
  for each row execute function public.handle_auth_user_insert();

drop trigger if exists on_auth_user_update on auth.users;
create trigger on_auth_user_update
  after update on auth.users
  for each row execute function public.handle_auth_user_update();

