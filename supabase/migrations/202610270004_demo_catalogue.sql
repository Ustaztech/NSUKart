-- Explicit, non-purchasable demonstration catalogue, owned by a signed-in MFA administrator.
-- Demo inventory is zero and must never be represented as available to buy.
create table public.demo_catalogue (
  product_id uuid primary key references public.products(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.demo_catalogue enable row level security;
revoke all on public.demo_catalogue from anon, authenticated;
create function public.seed_demo_catalogue() returns integer
language plpgsql security definer set search_path = public as $$
declare
  seller uuid := auth.uid();
  store_id uuid;
  count_inserted integer := 0;
  entry record;
  new_product uuid;
begin
  if not public.is_admin() then raise exception 'Administrator MFA is required'; end if;
  if exists (select 1 from public.demo_catalogue) then raise exception 'Demo catalogue already exists'; end if;
  if exists (select 1 from public.stores where owner_id = seller) then
    raise exception 'Admin account already owns a store. Use an admin account without a store to create demo listings';
  end if;
  insert into public.stores(owner_id,name,slug,description,pickup,status,review_note)
  values(seller,'NSUKart Demo Store','nsukart-demo-store',
    'Illustrative catalogue only. These products are not actually for sale.',
    'Demonstration only — no pickup available','approved','Demonstration store; administrator may remove it')
  returning id into store_id;
  for entry in
    select * from (values
      ('Computer Science Study Guide','Textbooks',450000,'New','Illustrative academic study guide. Demo only.'),
      ('Wireless Bluetooth Headphones','Electronics',1250000,'New','Illustrative headphones listing. Demo only.'),
      ('Student Backpack','Fashion',850000,'New','Illustrative everyday backpack. Demo only.'),
      ('Reading Desk Lamp','Hostel Essentials',600000,'New','Illustrative study lamp. Demo only.'),
      ('USB-C Charging Cable','Electronics',250000,'New','Illustrative charging accessory. Demo only.'),
      ('Notebook Bundle','Textbooks',320000,'New','Illustrative stationery bundle. Demo only.'),
      ('Ankara Tote Bag','Fashion',780000,'New','Illustrative handmade tote bag. Demo only.'),
      ('Hostel Storage Basket','Hostel Essentials',480000,'New','Illustrative storage basket. Demo only.')
    ) as items(title,category,price_kobo,condition,description)
  loop
    insert into public.products(store_id,title,description,category,price_kobo,stock,condition,kind,status)
    values(store_id,entry.title,entry.description,entry.category,entry.price_kobo,0,entry.condition,'product','published')
    returning id into new_product;
    insert into public.demo_catalogue(product_id) values(new_product);
    count_inserted := count_inserted + 1;
  end loop;
  insert into public.audit_log(actor_id,action,target_id,details)
  values(seller,'demo.seed',store_id,jsonb_build_object('count',count_inserted));
  return count_inserted;
end; $$;
revoke all on function public.seed_demo_catalogue() from public, anon;
grant execute on function public.seed_demo_catalogue() to authenticated;

create function public.clear_demo_catalogue() returns integer
language plpgsql security definer set search_path = public as $$
declare
  n integer;
  demo_store uuid;
begin
  if not public.is_admin() then raise exception 'Administrator MFA is required'; end if;
  select id into demo_store from public.stores where slug='nsukart-demo-store' and owner_id=auth.uid();
  if demo_store is null then raise exception 'Demo store is missing or belongs to another administrator'; end if;
  if exists(select 1 from public.order_items oi join public.demo_catalogue d on d.product_id=oi.product_id) then
    raise exception 'Demo products referenced by orders cannot be deleted';
  end if;
  delete from public.products where id in(select product_id from public.demo_catalogue);
  get diagnostics n = row_count;
  delete from public.stores where id=demo_store;
  insert into public.audit_log(actor_id,action,target_id,details)
  values(auth.uid(),'demo.clear',demo_store,jsonb_build_object('count',n));
  return n;
end; $$;
revoke all on function public.clear_demo_catalogue() from public, anon;
grant execute on function public.clear_demo_catalogue() to authenticated;
