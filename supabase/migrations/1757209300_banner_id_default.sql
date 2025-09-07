-- Ensure banner_messages.id has a default UUID
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='banner_messages' and column_name='id'
  ) then
    alter table public.banner_messages alter column id set default gen_random_uuid();
  end if;
end $$;

