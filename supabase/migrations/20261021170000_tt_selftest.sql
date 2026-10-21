-- Applied 2026-10-21. Keys for the access-token self-check; readable only by the service role (RLS on, no policies).
create table public.tt_selftest (key text primary key, created_at timestamptz not null default now());
alter table public.tt_selftest enable row level security;
