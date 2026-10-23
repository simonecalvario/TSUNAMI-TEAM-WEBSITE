-- Text fixes made from the site by the owner ("Edit texts" mode, assets/js/texts.js).
-- Each row replaces the text with that data-tx key, as long as the original in the page still matches `orig`.
create table public.site_texts (
  key text primary key,
  orig text not null,
  html text not null,
  email text not null default public.tt_me(),
  updated_at timestamptz not null default now()
);
alter table public.site_texts enable row level security;
create policy "members read" on public.site_texts for select to authenticated using (true);
create policy "owner writes" on public.site_texts for all to authenticated
  using (public.tt_me() = 'simone.calvario@gmail.com') with check (public.tt_me() = 'simone.calvario@gmail.com');
create policy "lockdown no anon" on public.site_texts as restrictive for all to anon using (false) with check (false);
grant select, insert, update, delete on public.site_texts to authenticated;
