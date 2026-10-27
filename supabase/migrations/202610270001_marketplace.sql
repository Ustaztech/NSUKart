-- NSUKart: all privileged mutations use narrowly scoped RPCs, not client metadata.
-- gen_random_uuid() is built into supported PostgreSQL versions.
create table public.profiles(id uuid primary key references auth.users on delete cascade,full_name text not null default '',phone text default '',matric_number text unique,role text not null default 'buyer' check(role in ('buyer','vendor','admin')),suspended boolean not null default false,created_at timestamptz not null default now());
create function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$ begin insert into profiles(id,full_name,phone,matric_number) values(new.id,left(coalesce(new.raw_user_meta_data->>'full_name',''),120),left(coalesce(new.raw_user_meta_data->>'phone',''),30),nullif(new.raw_user_meta_data->>'matric_number',''));return new;end;$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
create function public.active_user() returns boolean language sql stable security definer set search_path=public as $$select exists(select 1 from profiles where id=auth.uid() and not suspended)$$;
create function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$select exists(select 1 from profiles where id=auth.uid() and role='admin' and not suspended and (auth.jwt()->>'aal')='aal2')$$;
create table public.stores(id uuid primary key default gen_random_uuid(),owner_id uuid not null unique references profiles,name text not null check(length(name) between 2 and 100),slug text not null unique check(slug~'^[a-z0-9-]{3,100}$'),description text not null,pickup text not null,status text not null default 'pending' check(status in('pending','approved','rejected','suspended')),review_note text,created_at timestamptz not null default now());
create table public.products(id uuid primary key default gen_random_uuid(),store_id uuid not null references stores,title text not null check(length(title) between 3 and 150),description text not null,category text not null,price_kobo bigint not null check(price_kobo>0 and price_kobo<=1000000000),stock integer not null default 0 check(stock>=0),reserved integer not null default 0 check(reserved>=0 and reserved<=stock),condition text not null default 'New' check(condition in('New','Used')),kind text not null default 'product' check(kind in('product','service')),image_url text,status text not null default 'published' check(status in('draft','published','archived')),created_at timestamptz not null default now());
create index product_catalog_idx on products(status,category,created_at desc);
create table public.cart_items(id uuid primary key default gen_random_uuid(),buyer_id uuid not null references profiles,product_id uuid not null references products,quantity integer not null check(quantity between 1 and 20),unique(buyer_id,product_id));
create table public.wishlist(buyer_id uuid references profiles,product_id uuid references products,primary key(buyer_id,product_id));
create table public.orders(id uuid primary key default gen_random_uuid(),buyer_id uuid not null references profiles,total_kobo bigint not null check(total_kobo>0),payment_reference text not null unique,checkout_url text,last_checked_at timestamptz,payment_status text not null default 'pending' check(payment_status in('pending','paid','expired','refund_required','refunded')),expires_at timestamptz not null default now()+interval '20 minutes',created_at timestamptz not null default now());
create table public.vendor_orders(id uuid primary key default gen_random_uuid(),order_id uuid not null references orders,store_id uuid not null references stores,subtotal_kobo bigint not null,commission_kobo bigint not null,pickup_snapshot text not null,status text not null default 'pending' check(status in('pending','accepted','ready','completed','cancelled')),pickup_code text not null default upper(substr(replace(gen_random_uuid()::text,'-',''),1,8)),completed_at timestamptz,unique(order_id,store_id));
create table public.order_items(id uuid primary key default gen_random_uuid(),order_id uuid not null references orders,vendor_order_id uuid not null references vendor_orders,product_id uuid not null references products,title text not null,unit_kobo bigint not null,quantity integer not null);
create table public.payment_events(id uuid primary key default gen_random_uuid(),reference text not null unique,amount_kobo bigint not null,currency text not null,created_at timestamptz not null default now());
create table public.ledger(id uuid primary key default gen_random_uuid(),store_id uuid not null references stores,vendor_order_id uuid references vendor_orders,amount_kobo bigint not null,kind text not null check(kind in('sale','refund','withdrawal','withdrawal_reversal')),created_at timestamptz not null default now());
create unique index ledger_one_sale on ledger(vendor_order_id) where kind='sale';
create table public.withdrawals(id uuid primary key default gen_random_uuid(),store_id uuid not null references stores,amount_kobo bigint not null check(amount_kobo>0),bank_details text not null,status text not null default 'requested' check(status in('requested','processing','paid','rejected')),provider_reference text unique,created_at timestamptz not null default now());
create table public.reviews(id uuid primary key default gen_random_uuid(),buyer_id uuid not null references profiles,order_item_id uuid not null unique references order_items,product_id uuid not null references products,rating integer not null check(rating between 1 and 5),body text not null check(length(body) between 3 and 2000),visible boolean not null default true,created_at timestamptz not null default now());
create table public.disputes(id uuid primary key default gen_random_uuid(),buyer_id uuid not null references profiles,vendor_order_id uuid not null references vendor_orders,reason text not null check(length(reason) between 10 and 4000),status text not null default 'open' check(status in('open','review','resolved','closed')),resolution text,created_at timestamptz not null default now());
create table public.messages(id uuid primary key default gen_random_uuid(),vendor_order_id uuid not null references vendor_orders,sender_id uuid not null references profiles,body text not null check(length(body) between 1 and 2000),created_at timestamptz not null default now());
create table public.notifications(id uuid primary key default gen_random_uuid(),user_id uuid not null references profiles,title text not null,body text not null,read_at timestamptz,created_at timestamptz not null default now());
create table public.audit_log(id uuid primary key default gen_random_uuid(),actor_id uuid references profiles,action text not null,target_id uuid,details jsonb not null default '{}',created_at timestamptz not null default now());
create table public.email_jobs(id uuid primary key default gen_random_uuid(),user_id uuid not null references profiles,subject text not null,body text not null,state text not null default 'pending' check(state in('pending','processing','sent','failed')),attempts integer not null default 0,available_at timestamptz not null default now(),locked_until timestamptz,created_at timestamptz not null default now());
create function public.notify_user(p_user uuid,p_title text,p_body text) returns void language plpgsql security definer set search_path=public as $$begin insert into notifications(user_id,title,body) values(p_user,p_title,p_body);insert into email_jobs(user_id,subject,body) values(p_user,p_title,p_body);end;$$;
create function public.owns_store(p_store uuid) returns boolean language sql stable security definer set search_path=public as $$select exists(select 1 from stores where id=p_store and owner_id=auth.uid()) and active_user()$$;
create function public.order_party(p_vo uuid) returns boolean language sql stable security definer set search_path=public as $$select exists(select 1 from vendor_orders v join orders o on o.id=v.order_id join stores s on s.id=v.store_id where v.id=p_vo and (o.buyer_id=auth.uid() or s.owner_id=auth.uid())) and active_user()$$;
-- Checkout is serialized per buyer and locks products in a stable order.
create function public.checkout_cart() returns uuid language plpgsql security definer set search_path=public as $$
declare oid uuid; total bigint; ref text; r record; vo uuid;
begin
 if not active_user() then raise exception 'Account unavailable';end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 select id into oid from orders where buyer_id=auth.uid() and payment_status='pending' and expires_at>now() order by created_at desc limit 1;
 if oid is not null then return oid;end if;
 if not exists(select 1 from cart_items where buyer_id=auth.uid()) then raise exception 'Your cart is empty';end if;
 for r in select p.*,c.quantity,s.status as store_status,s.owner_id from cart_items c join products p on p.id=c.product_id join stores s on s.id=p.store_id where c.buyer_id=auth.uid() order by p.id for update of p loop
 if r.status<>'published' or r.store_status<>'approved' or r.owner_id=auth.uid() or (r.kind='product' and r.stock-r.reserved<r.quantity) then raise exception 'A product is unavailable or has insufficient stock';end if;
 end loop;
 select sum(p.price_kobo*c.quantity) into total from cart_items c join products p on p.id=c.product_id where c.buyer_id=auth.uid();
 ref:='NSUK-'||gen_random_uuid()::text;
 insert into orders(buyer_id,total_kobo,payment_reference) values(auth.uid(),total,ref) returning id into oid;
 for r in select p.store_id,sum(p.price_kobo*c.quantity) as subtotal,s.pickup from cart_items c join products p on p.id=c.product_id join stores s on s.id=p.store_id where c.buyer_id=auth.uid() group by p.store_id,s.pickup loop
 insert into vendor_orders(order_id,store_id,subtotal_kobo,commission_kobo,pickup_snapshot) values(oid,r.store_id,r.subtotal,(r.subtotal*5)/100,r.pickup) returning id into vo;
 insert into order_items(order_id,vendor_order_id,product_id,title,unit_kobo,quantity) select oid,vo,p.id,p.title,p.price_kobo,c.quantity from cart_items c join products p on p.id=c.product_id where c.buyer_id=auth.uid() and p.store_id=r.store_id;
 end loop;
 update products p set reserved=p.reserved+c.quantity from cart_items c where c.product_id=p.id and c.buyer_id=auth.uid() and p.kind='product';
 delete from cart_items where buyer_id=auth.uid();
 return oid;
end;$$;
-- Service-role only. A late paid reservation is recorded for manual refund, never lost.
create function public.confirm_payment(p_reference text,p_amount bigint,p_currency text) returns text language plpgsql security definer set search_path=public as $$
declare o orders; r record;
begin
 select * into o from orders where payment_reference=p_reference for update;
 if not found then raise exception 'Unknown reference';end if;
 if o.total_kobo<>p_amount or p_currency<>'NGN' then raise exception 'Payment amount or currency mismatch';end if;
 if o.payment_status in('paid','refund_required','refunded') then return o.payment_status;end if;
 insert into payment_events(reference,amount_kobo,currency) values(p_reference,p_amount,p_currency) on conflict do nothing;
 if o.payment_status='expired' then
 update orders set payment_status='refund_required' where id=o.id;
 perform notify_user(o.buyer_id,'Payment needs review','Payment arrived after your reservation expired. Support must arrange a refund.');return 'refund_required';
 end if;
 for r in select p.id,i.quantity from order_items i join products p on p.id=i.product_id where i.order_id=o.id and p.kind='product' order by p.id for update of p loop
 update products set stock=stock-r.quantity,reserved=reserved-r.quantity where id=r.id;
 end loop;
 update orders set payment_status='paid' where id=o.id;
 perform notify_user(o.buyer_id,'Payment confirmed','Your NSUKart order has been paid. Track vendor progress from your orders page.');
 for r in select s.owner_id from vendor_orders v join stores s on s.id=v.store_id where v.order_id=o.id loop perform notify_user(r.owner_id,'New paid order','A buyer has paid for an order in your store. Sign in to prepare it.');end loop;
 return 'paid';end;$$;
create function public.expire_reservations() returns integer language plpgsql security definer set search_path=public as $$declare o record;r record;n integer:=0;begin
 for o in select id from orders where payment_status='pending' and expires_at<now() for update skip locked loop
 for r in select p.id,i.quantity from order_items i join products p on p.id=i.product_id where i.order_id=o.id and p.kind='product' order by p.id for update of p loop update products set reserved=reserved-r.quantity where id=r.id;end loop;
 update orders set payment_status='expired' where id=o.id;n:=n+1;end loop;return n;end;$$;
create function public.update_fulfilment(p_id uuid,p_status text,p_code text default null) returns void language plpgsql security definer set search_path=public as $$declare v vendor_orders;o orders;s stores;begin
 select * into v from vendor_orders where id=p_id for update;select * into o from orders where id=v.order_id;select * into s from stores where id=v.store_id;
 if not active_user() or o.payment_status<>'paid' then raise exception 'Order cannot be updated';end if;
 if p_status='completed' then
 if o.buyer_id<>auth.uid() or v.status<>'ready' or p_code is distinct from v.pickup_code then raise exception 'Buyer and valid pickup code required';end if;
 if exists(select 1 from disputes where vendor_order_id=v.id and status in('open','review')) then raise exception 'Resolve the dispute before completion';end if;
 insert into ledger(store_id,vendor_order_id,amount_kobo,kind) values(v.store_id,v.id,v.subtotal_kobo-v.commission_kobo,'sale');
 elsif s.owner_id<>auth.uid() or not((v.status='pending' and p_status='accepted') or (v.status='accepted' and p_status='ready')) then raise exception 'Invalid order transition';end if;
 update vendor_orders set status=p_status,completed_at=case when p_status='completed' then now() else null end where id=v.id;
 perform notify_user(o.buyer_id,'Order updated','Your vendor order is now '||p_status||'.');end;$$;
create function public.review_vendor(p_id uuid,p_status text,p_note text) returns void language plpgsql security definer set search_path=public as $$declare s stores;begin
 if not is_admin() or p_status not in('approved','rejected','suspended') then raise exception 'Not authorized';end if;
 select * into s from stores where id=p_id for update;if not found then raise exception 'Store not found';end if;
 update stores set status=p_status,review_note=p_note where id=p_id;
 if p_status='approved' then update profiles set role='vendor' where id=s.owner_id and role<>'admin';end if;
 insert into audit_log(actor_id,action,target_id,details) values(auth.uid(),'vendor.'||p_status,p_id,jsonb_build_object('note',p_note));
 perform notify_user(s.owner_id,'Store application updated','Your store status is '||p_status||'. '||coalesce(p_note,''));end;$$;
create function public.save_product(p_id uuid,p_store uuid,p_title text,p_description text,p_category text,p_price bigint,p_stock integer,p_condition text,p_kind text,p_image text) returns uuid language plpgsql security definer set search_path=public as $$declare result uuid;begin
 if not owns_store(p_store) or not exists(select 1 from stores where id=p_store and status='approved') then raise exception 'Approved vendor required';end if;
 if p_id is null then insert into products(store_id,title,description,category,price_kobo,stock,condition,kind,image_url) values(p_store,p_title,p_description,p_category,p_price,p_stock,p_condition,p_kind,p_image) returning id into result;
 else update products set title=p_title,description=p_description,category=p_category,price_kobo=p_price,stock=p_stock,condition=p_condition,kind=p_kind,image_url=p_image where id=p_id and store_id=p_store returning id into result;
 if result is null then raise exception 'Product not found';end if;end if;return result;end;$$;
create function public.request_withdrawal(p_amount bigint,p_bank text) returns uuid language plpgsql security definer set search_path=public as $$declare s stores;balance bigint;wid uuid;begin
 select * into s from stores where owner_id=auth.uid() and status='approved' for update;
 if not active_user() or s.id is null then raise exception 'Approved vendor required';end if;
 select coalesce(sum(amount_kobo),0) into balance from ledger where store_id=s.id;
 if p_amount<10000 or p_amount>balance or length(p_bank)<10 then raise exception 'Invalid withdrawal or insufficient available earnings';end if;
 insert into withdrawals(store_id,amount_kobo,bank_details) values(s.id,p_amount,p_bank) returning id into wid;
 insert into ledger(store_id,amount_kobo,kind) values(s.id,-p_amount,'withdrawal');return wid;end;$$;
create function public.claim_email_jobs() returns setof email_jobs language plpgsql security definer set search_path=public as $$begin return query with batch as(select id from email_jobs where ((state='pending' and available_at<=now()) or (state='processing' and locked_until<now())) and attempts<5 order by created_at for update skip locked limit 20) update email_jobs j set state='processing',attempts=attempts+1,locked_until=now()+interval '5 minutes' from batch where j.id=batch.id returning j.*;end;$$;
-- RLS is deny-by-default; public catalogue never exposes bank details or buyer data.
alter table profiles enable row level security;
create policy profile_read on profiles for select to authenticated using(id=auth.uid() or is_admin());
alter table stores enable row level security;
create policy store_read on stores for select using(status='approved' or owner_id=auth.uid() or is_admin());
create policy store_apply on stores for insert to authenticated with check(owner_id=auth.uid() and status='pending' and active_user());
alter table products enable row level security;
create policy product_read on products for select using((status='published' and exists(select 1 from stores where id=store_id and status='approved')) or owns_store(store_id) or is_admin());
create policy product_admin on products for update to authenticated using(is_admin()) with check(is_admin());
alter table cart_items enable row level security;
create policy cart_own on cart_items for all to authenticated using(buyer_id=auth.uid() and active_user()) with check(buyer_id=auth.uid() and active_user());
alter table wishlist enable row level security;
create policy wishlist_own on wishlist for all to authenticated using(buyer_id=auth.uid() and active_user()) with check(buyer_id=auth.uid() and active_user());
alter table orders enable row level security;
create policy order_read on orders for select to authenticated using(buyer_id=auth.uid() or is_admin());
alter table vendor_orders enable row level security;
create policy vo_read on vendor_orders for select to authenticated using(order_party(id) or is_admin());
alter table order_items enable row level security;
create policy item_read on order_items for select to authenticated using(order_party(vendor_order_id) or is_admin());
alter table ledger enable row level security;
create policy ledger_read on ledger for select to authenticated using(owns_store(store_id) or is_admin());
alter table withdrawals enable row level security;
create policy withdrawals_read on withdrawals for select to authenticated using(owns_store(store_id) or is_admin());
alter table reviews enable row level security;
create policy reviews_read on reviews for select using(visible or buyer_id=auth.uid() or is_admin());
create policy reviews_insert on reviews for insert to authenticated with check(buyer_id=auth.uid() and active_user() and not exists(select 1 from products p join stores s on s.id=p.store_id where p.id=product_id and s.owner_id=auth.uid()) and exists(select 1 from order_items i join vendor_orders v on v.id=i.vendor_order_id join orders o on o.id=i.order_id where i.id=order_item_id and i.product_id=reviews.product_id and o.buyer_id=auth.uid() and v.status='completed' and o.payment_status='paid'));
alter table disputes enable row level security;
create policy disputes_read on disputes for select to authenticated using(order_party(vendor_order_id) or is_admin());
create policy disputes_insert on disputes for insert to authenticated with check(buyer_id=auth.uid() and active_user() and exists(select 1 from vendor_orders v join orders o on o.id=v.order_id where v.id=vendor_order_id and o.buyer_id=auth.uid() and o.payment_status='paid' and v.status<>'completed'));
create policy disputes_admin on disputes for update to authenticated using(is_admin()) with check(is_admin());
alter table messages enable row level security;
create policy message_read on messages for select to authenticated using(order_party(vendor_order_id) or is_admin());
create policy message_insert on messages for insert to authenticated with check(sender_id=auth.uid() and order_party(vendor_order_id));
alter table notifications enable row level security;
create policy notification_read on notifications for select to authenticated using(user_id=auth.uid());
create policy notification_update on notifications for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
alter table audit_log enable row level security;
create policy audit_read on audit_log for select to authenticated using(is_admin());
alter table email_jobs enable row level security;
alter table payment_events enable row level security;
revoke all on function public.notify_user(uuid,text,text) from public,anon,authenticated;
revoke all on function public.confirm_payment(text,bigint,text) from public,anon,authenticated;
revoke all on function public.expire_reservations() from public,anon,authenticated;
revoke all on function public.claim_email_jobs() from public,anon,authenticated;
grant execute on function public.confirm_payment(text,bigint,text),public.expire_reservations(),public.claim_email_jobs() to service_role;
revoke all on function public.checkout_cart(),public.update_fulfilment(uuid,text,text),public.review_vendor(uuid,text,text),public.save_product(uuid,uuid,text,text,text,bigint,integer,text,text,text),public.request_withdrawal(bigint,text) from public,anon;
grant execute on function public.checkout_cart(),public.update_fulfilment(uuid,text,text),public.review_vendor(uuid,text,text),public.save_product(uuid,uuid,text,text,text,bigint,integer,text,text,text),public.request_withdrawal(bigint,text) to authenticated;
-- No direct role, balance, price-snapshot, or payment mutations for normal users.
revoke all on profiles,stores,products,cart_items,wishlist,orders,vendor_orders,order_items,payment_events,ledger,withdrawals,reviews,disputes,messages,notifications,audit_log,email_jobs from anon,authenticated;
grant select on stores,products,reviews to anon;
grant select on profiles,stores,products,cart_items,wishlist,orders,vendor_orders,order_items,ledger,withdrawals,reviews,disputes,messages,notifications,audit_log to authenticated;
grant insert on stores,cart_items,wishlist,reviews,disputes,messages to authenticated;
grant update(quantity) on cart_items to authenticated;
grant delete on cart_items,wishlist to authenticated;
grant update(read_at) on notifications to authenticated;
grant update(status) on products to authenticated;
grant update(status,resolution) on disputes to authenticated;
-- Image storage. Upload is vendor-owned and bounded by storage bucket limits.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('product-images','product-images',true,5242880,array['image/jpeg','image/png','image/webp']) on conflict do nothing;
create policy image_public on storage.objects for select using(bucket_id='product-images');
create policy image_vendor_upload on storage.objects for insert to authenticated with check(bucket_id='product-images' and (storage.foldername(name))[1]=auth.uid()::text and exists(select 1 from stores where owner_id=auth.uid() and status='approved'));
create function public.vendor_order_feed() returns jsonb language sql stable security definer set search_path=public as $$
select coalesce(jsonb_agg(row_data order by row_data->>'order_id'),'[]'::jsonb) from (
 select to_jsonb(v)||jsonb_build_object('stores',jsonb_build_object('name',s.name),'order_items',coalesce((select jsonb_agg(to_jsonb(i)) from order_items i where i.vendor_order_id=v.id),'[]'::jsonb),'messages',coalesce((select jsonb_agg(jsonb_build_object('id',m.id,'body',m.body,'created_at',m.created_at) order by m.created_at) from messages m where m.vendor_order_id=v.id),'[]'::jsonb)) row_data
 from vendor_orders v join stores s on s.id=v.store_id join orders o on o.id=v.order_id where s.owner_id=auth.uid() and active_user() and o.payment_status='paid' order by o.created_at desc limit 100
) feed;$$;
revoke all on function public.vendor_order_feed() from public,anon;
grant execute on function public.vendor_order_feed() to authenticated;
-- Audit privileged edits and dispute outcomes, without storing customer message text.
create function public.audit_moderation() returns trigger language plpgsql security definer set search_path=public as $$begin insert into audit_log(actor_id,action,target_id,details) values(auth.uid(),tg_table_name||'.updated',new.id,jsonb_build_object('status',new.status));return new;end;$$;
create trigger audit_product_status after update of status on products for each row execute function public.audit_moderation();
create trigger audit_dispute_status after update of status on disputes for each row execute function public.audit_moderation();
