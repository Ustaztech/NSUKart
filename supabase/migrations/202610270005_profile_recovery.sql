-- Repair only missing profiles, never alter existing role or suspension state.
-- Callable only by the currently authenticated user; cannot select another account.
create or replace function public.repair_own_profile()
returns boolean language plpgsql security definer set search_path = public, auth as $$
declare u auth.users;
begin
  if auth.uid() is null then return false; end if;
  select * into u from auth.users where id = auth.uid();
  if not found then return false; end if;
  insert into public.profiles(id,full_name,phone,matric_number,role,suspended)
  values(u.id,left(coalesce(u.raw_user_meta_data->>'full_name',''),120),
         left(coalesce(u.raw_user_meta_data->>'phone',''),30),
         nullif(u.raw_user_meta_data->>'matric_number',''),'buyer',false)
  on conflict (id) do nothing;
  return exists(select 1 from public.profiles where id=u.id and not suspended);
end $$;
revoke all on function public.repair_own_profile() from public, anon;
grant execute on function public.repair_own_profile() to authenticated;

-- Restore profiles missing from previous signups. Never modify existing records.
insert into public.profiles(id,full_name,phone,matric_number,role,suspended)
select u.id,left(coalesce(u.raw_user_meta_data->>'full_name',''),120),
       left(coalesce(u.raw_user_meta_data->>'phone',''),30),
       nullif(u.raw_user_meta_data->>'matric_number',''),'buyer',false
from auth.users u left join public.profiles p on p.id=u.id
where p.id is null
on conflict do nothing;
