-- Queue transactional onboarding emails at the database boundary, once per event.
-- Uses the existing durable email_jobs worker and avoids coupling account creation to Resend availability.
create function public.queue_welcome_email() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.email_jobs(user_id, subject, body)
  values (
    new.id,
    'Welcome to NSUKart!',
    'Hi ' || coalesce(nullif(new.full_name, ''), 'there') || E',\n\n'
    || 'Your NSUKart account has been created successfully. Discover products, support campus businesses, and start shopping on NSUKart.'
    || E'\n\nExplore the marketplace: /marketplace'
  );
  return new;
end; $$;
revoke all on function public.queue_welcome_email() from public, anon, authenticated;
create trigger nsukart_profile_welcome_email
after insert on public.profiles
for each row execute function public.queue_welcome_email();

create function public.queue_store_application_email() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.notify_user(
    new.owner_id,
    'Your NSUKart store was created',
    'Your store "' || new.name || '" was created successfully and your application is pending administrator approval.'
    || E'\n\nWe will notify you when it is reviewed. Manage your store application: /vendor/apply'
  );
  return new;
end; $$;
revoke all on function public.queue_store_application_email() from public, anon, authenticated;
create trigger nsukart_store_created_email
after insert on public.stores
for each row execute function public.queue_store_application_email();
