-- Phase 1 of the security upgrade + tables for the new features.
-- Applied on 2026-10-21. Safe to apply before the /api/token Worker is live: the existing anon policies stay,
-- the new "authenticated" policies only apply to requests signed by the Worker.

-- The member's email from the signed token.
create or replace function public.tt_me() returns text
language sql stable set search_path = '' as $$ select lower(auth.jwt() ->> 'email') $$;

-- ---------- member policies on existing tables ----------
do $$
declare t text;
begin
  foreach t in array array['attendance','birthdays','booster_favs','booster_reads','chat_messages','comments','meeting_days',
                           'meeting_photos','meeting_votes','memorabilia','nicknames','photo_comments','photo_reactions','posts','reactions']
  loop
    execute format('create policy "members read" on public.%I for select to authenticated using (true)', t);
    execute format('create policy "own insert" on public.%I for insert to authenticated with check (email = public.tt_me())', t);
    if t <> 'nicknames' then
      execute format('create policy "own update" on public.%I for update to authenticated using (email = public.tt_me()) with check (email = public.tt_me())', t);
      execute format('create policy "own delete" on public.%I for delete to authenticated using (email = public.tt_me())', t);
    end if;
  end loop;
end $$;

create policy "own subscriptions" on public.push_subscriptions for all to authenticated
  using (email = public.tt_me()) with check (email = public.tt_me());

create policy "members upload blog images" on storage.objects for insert to authenticated
  with check (bucket_id = 'blog-images');
create policy "members read blog images" on storage.objects for select to authenticated
  using (bucket_id = 'blog-images');

-- ---------- advisor fixes ----------
alter function public.notify_push() set search_path = '';
revoke execute on function public.notify_push() from public, anon, authenticated;
alter view public.vote_totals set (security_invoker = true);

-- ---------- new tables ----------
-- Profile: your liquid and your home city (for Reconnect and the Wrapped kilometres).
create table public.profiles (
  email text primary key,
  liquid text check (liquid in ('lake','river','wave','tsunami')),
  city text check (char_length(city) <= 100), country text check (char_length(country) <= 100),
  lat double precision, lng double precision,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

-- Meeting room for the next Tsunami Meeting.
create table public.trip_rsvp (
  trip text not null, email text not null,
  status text not null check (status in ('yes','maybe','no')),
  arrive_at timestamptz, depart_at timestamptz,
  note text check (char_length(note) <= 200),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  primary key (trip, email)
);
create table public.trip_items (
  id bigint generated always as identity primary key,
  trip text not null, kind text not null check (kind in ('todo','bring')),
  body text not null check (char_length(body) between 1 and 200),
  email text not null, done_by text,
  created_at timestamptz not null default now()
);
create table public.trip_expenses (
  id bigint generated always as identity primary key,
  trip text not null, email text not null,
  amount numeric(10,2) not null check (amount > 0 and amount < 100000),
  currency text not null default 'EUR' check (char_length(currency) = 3),
  note text not null check (char_length(note) between 1 and 120),
  split text[] not null check (cardinality(split) between 1 and 40),
  created_at timestamptz not null default now()
);

-- Time capsule: sealed messages, readable by nobody until open_at.
create table public.capsule (
  id bigint generated always as identity primary key,
  email text not null, nickname text,
  body text not null check (char_length(body) between 1 and 2000),
  open_at date not null,
  created_at timestamptz not null default now()
);
create or replace function public.capsule_sealed() returns table (email text, n bigint, open_at date)
language sql stable security definer set search_path = '' as $$
  select c.email, count(*), min(c.open_at) from public.capsule c where c.open_at > current_date group by c.email
$$;

-- Reconnect: "I'll be in <city> on these days".
create table public.travel_pings (
  id bigint generated always as identity primary key,
  email text not null, nickname text,
  city text not null check (char_length(city) <= 100), country text check (char_length(country) <= 100),
  lat double precision not null, lng double precision not null,
  from_date date not null, to_date date not null check (to_date >= from_date),
  note text check (char_length(note) <= 200),
  created_at timestamptz not null default now()
);
create trigger push_travel after insert on public.travel_pings for each row execute function public.notify_push();

alter table public.profiles enable row level security;
alter table public.trip_rsvp enable row level security;
alter table public.trip_items enable row level security;
alter table public.trip_expenses enable row level security;
alter table public.capsule enable row level security;
alter table public.travel_pings enable row level security;

do $$
declare t text;
begin
  foreach t in array array['profiles','trip_rsvp','trip_items','trip_expenses','capsule','travel_pings'] loop
    -- transitional, like the existing tables (removed by the lockdown migration)
    if t <> 'capsule' then
      execute format('create policy "anon read" on public.%I for select to anon using (true)', t);
    end if;
    execute format('create policy "anon insert" on public.%I for insert to anon with check (true)', t);
    execute format('create policy "anon update" on public.%I for update to anon using (true) with check (true)', t);
    execute format('create policy "anon delete" on public.%I for delete to anon using (true)', t);
    -- members
    if t <> 'capsule' then
      execute format('create policy "members read" on public.%I for select to authenticated using (true)', t);
    end if;
    execute format('create policy "own insert" on public.%I for insert to authenticated with check (email = public.tt_me())', t);
    execute format('create policy "own update" on public.%I for update to authenticated using (email = public.tt_me()) with check (email = public.tt_me())', t);
    execute format('create policy "own delete" on public.%I for delete to authenticated using (email = public.tt_me())', t);
  end loop;
end $$;

create policy "anon read opened" on public.capsule for select to anon using (open_at <= current_date);
create policy "read opened or own" on public.capsule for select to authenticated using (open_at <= current_date or email = public.tt_me());

-- Anyone in the crew can tick a checklist item; other columns stay as the author wrote them.
create policy "members tick items" on public.trip_items for update to authenticated
  using (true) with check (done_by is null or done_by = public.tt_me());
create or replace function public.tt_items_tick_only() returns trigger
language plpgsql set search_path = '' as $$
begin
  if coalesce(public.tt_me(), '') <> old.email then
    new.trip := old.trip; new.kind := old.kind; new.body := old.body; new.email := old.email; new.created_at := old.created_at;
  end if;
  return new;
end $$;
create trigger items_tick_only before update on public.trip_items for each row execute function public.tt_items_tick_only();
