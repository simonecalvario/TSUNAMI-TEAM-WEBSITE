-- Applied 2026-10-22. The old x-push-secret did not match send-push's PUSH_SECRET (every push got 401).
-- Server-only settings (RLS on, no policies: only the service role and security-definer functions read them).
create table public.tt_config (name text primary key, value text not null);
alter table public.tt_config enable row level security;
create policy "lockdown no anon" on public.tt_config as restrictive for all to anon using (false) with check (false);
insert into public.tt_config(name, value) values ('push_secret', replace(gen_random_uuid()::text, '-', '') || md5(random()::text));

-- notify_push signs its calls with the secret above (send-push checks it with the service role).
-- (The function body keeps the project's public anon key in the Authorization header, as before.)
