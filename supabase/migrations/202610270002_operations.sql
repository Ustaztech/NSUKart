-- Explicit operator-assisted settlement, audited and idempotent at the database boundary.
create function public.review_withdrawal(p_id uuid,p_status text,p_reference text default null) returns void language plpgsql security definer set search_path=public as $$declare w withdrawals;begin
 if not is_admin() then raise exception 'Administrator with MFA required';end if;
 select * into w from withdrawals where id=p_id for update;if not found then raise exception 'Request not found';end if;
 if w.status in('paid','rejected') then raise exception 'Request already finalized';end if;
 if p_status='processing' and w.status='requested' then update withdrawals set status='processing' where id=p_id;
 elsif p_status='paid' and w.status='processing' and length(coalesce(p_reference,''))>=5 then update withdrawals set status='paid',provider_reference=p_reference where id=p_id;
 elsif p_status='rejected' and w.status='requested' then update withdrawals set status='rejected' where id=p_id;insert into ledger(store_id,amount_kobo,kind) values(w.store_id,w.amount_kobo,'withdrawal_reversal');
 else raise exception 'Invalid settlement transition or missing provider reference';end if;
 insert into audit_log(actor_id,action,target_id,details) values(auth.uid(),'withdrawal.'||p_status,p_id,jsonb_build_object('provider_reference',p_reference));end;$$;
revoke all on function public.review_withdrawal(uuid,text,text) from public,anon;
grant execute on function public.review_withdrawal(uuid,text,text) to authenticated;
create function public.manage_account(p_id uuid,p_suspended boolean) returns void language plpgsql security definer set search_path=public as $$begin
 if not is_admin() or p_id=auth.uid() or exists(select 1 from profiles where id=p_id and role='admin') then raise exception 'Not authorized';end if;
 update profiles set suspended=p_suspended where id=p_id;
 if p_suspended then update stores set status='suspended' where owner_id=p_id;end if;
 insert into audit_log(actor_id,action,target_id,details) values(auth.uid(),'account.suspension',p_id,jsonb_build_object('suspended',p_suspended));end;$$;
revoke all on function public.manage_account(uuid,boolean) from public,anon;
grant execute on function public.manage_account(uuid,boolean) to authenticated;
create function public.update_profile(p_name text,p_phone text) returns void language plpgsql security definer set search_path=public as $$begin
 if not active_user() or length(p_name)<2 or length(p_name)>120 or p_phone!~'^(\+234|0)[789][0-9]{9}$' then raise exception 'Invalid profile';end if;
 update profiles set full_name=p_name,phone=p_phone where id=auth.uid();end;$$;
revoke all on function public.update_profile(text,text) from public,anon;
grant execute on function public.update_profile(text,text) to authenticated;
create function public.mark_notifications_read() returns void language sql security definer set search_path=public as $$update notifications set read_at=now() where user_id=auth.uid() and read_at is null and active_user()$$;
revoke all on function public.mark_notifications_read() from public,anon;
grant execute on function public.mark_notifications_read() to authenticated;
-- Durable per-user request throttling, shared across serverless instances.
create table public.request_limits(user_id uuid not null,bucket text not null,window_start timestamptz not null,hits integer not null default 1,primary key(user_id,bucket,window_start));
alter table request_limits enable row level security;
revoke all on request_limits from anon,authenticated;
create function public.consume_limit(p_bucket text,p_max integer) returns boolean language plpgsql security definer set search_path=public as $$declare hits integer;begin
 if not active_user() or p_bucket not in('checkout','upload','message','payment') or p_max not between 1 and 60 then return false;end if;
 insert into request_limits values(auth.uid(),p_bucket,date_trunc('minute',now()),1) on conflict(user_id,bucket,window_start) do update set hits=request_limits.hits+1 returning request_limits.hits into hits;return hits<=p_max;end;$$;
revoke all on function public.consume_limit(text,integer) from public,anon;
grant execute on function public.consume_limit(text,integer) to authenticated;
