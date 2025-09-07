-- This migration automates the team invitation process by creating a function
-- that is triggered on user sign-up and login. It makes the `app_users` table
-- the source of truth for application-level roles, as it should be.

-- 1. Create a reusable function to process pending invites for a user.
create or replace function public.accept_pending_invites_for_user(p_user_id uuid, p_user_email text)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  r_invite record;
begin
  -- Loop through all valid, pending invites for the user's email
  for r_invite in
    select * from public.team_invites
    where lower(email) = lower(p_user_email)
      and accepted_at is null
      and expires_at > now()
  loop
    -- Add the user to the team
    insert into public.team_members (team_id, user_id, role)
    values (r_invite.team_id, p_user_id, r_invite.role)
    on conflict (team_id, user_id) do nothing; -- Do nothing if they are already a member

    -- Mark the invite as accepted
    update public.team_invites
    set accepted_at = now()
    where id = r_invite.id;

    raise notice 'Accepted invite % for user % to team %', r_invite.id, p_user_id, r_invite.team_id;
  end loop;
end;
$$;

-- 2. Update the trigger for NEW user sign-ups.
-- It now calls the function to accept any pending invites.
create or replace function public.handle_auth_user_insert()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Create the app_user record
  insert into public.app_users (id, email, role)
  values (
    new.id,
    new.email,
    public._coerce_user_role( (new.raw_user_meta_data ->> 'role') )
  )
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();

  -- Check for and accept any pending invites
  perform public.accept_pending_invites_for_user(new.id, new.email);

  return new;
end;
$$;

-- 3. Update the trigger for EXISTING user logins/updates.
-- It now ALSO calls the function to accept any pending invites.
create or replace function public.handle_auth_user_update()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Sync email and update timestamp
  update public.app_users
     set email = new.email,
         updated_at = now()
   where id = new.id;

  -- Check for and accept any pending invites
  perform public.accept_pending_invites_for_user(new.id, new.email);

  return new;
end;
$$;
