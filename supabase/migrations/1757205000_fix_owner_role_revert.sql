-- Fixes an issue where the 'owner' role was being reverted to 'user' on login.
-- The previous version of this function did not recognize the 'owner' role and defaulted to 'user'.

create or replace function public._coerce_user_role(role_text text)
returns user_role
language sql
immutable
as $$
  select case lower(coalesce(role_text, ''))
           when 'owner' then 'owner'::user_role
           when 'admin' then 'admin'::user_role
           else 'user'::user_role
         end;
$$;
