-- Applied 2026-10-22. Birthday Boost: on a member's birthday every other member sends one emoji "wave" (optional short note).
create table public.birthday_waves (
  bday_email text not null,
  year int not null,
  email text not null,
  emoji text not null check (emoji in ('🌊','🌪️','🏄','🎉','🥂','🎂')),
  note text check (char_length(note) <= 140),
  created_at timestamptz not null default now(),
  primary key (bday_email, year, email),
  check (email <> bday_email)
);
alter table public.birthday_waves enable row level security;
create policy "members read" on public.birthday_waves for select to authenticated using (true);
create policy "own insert" on public.birthday_waves for insert to authenticated with check (email = public.tt_me());
create policy "own update" on public.birthday_waves for update to authenticated using (email = public.tt_me()) with check (email = public.tt_me());
create policy "own delete" on public.birthday_waves for delete to authenticated using (email = public.tt_me());
create policy "lockdown no anon" on public.birthday_waves as restrictive for all to anon using (false) with check (false);
create trigger push_waves after insert on public.birthday_waves for each row execute function public.notify_push();

-- Scheduled pushes go through this table, so the push secret stays inside notify_push().
create table public.push_events (
  id bigint generated always as identity primary key,
  kind text not null,
  created_at timestamptz not null default now()
);
alter table public.push_events enable row level security;
create policy "lockdown no anon" on public.push_events as restrictive for all to anon using (false) with check (false);
create trigger push_events_fire after insert on public.push_events for each row execute function public.notify_push();

create extension if not exists pg_cron;
-- 07:00 and 08:00 UTC; send-push only acts when it is 9 in Rome (covers summer and winter time).
select cron.schedule('tsunami-birthday-morning', '0 7,8 * * *', $$insert into public.push_events(kind) values ('birthday_morning')$$);
