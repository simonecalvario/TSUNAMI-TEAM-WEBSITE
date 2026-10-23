-- Push to the whole team when a new Blog post is published.
create trigger push_posts after insert on public.posts
  for each row execute function public.notify_push();

-- "What's new": every structural change of the site (new sections, features) gets a line here,
-- shown in the bell and sent as a push to everyone. Written only from the dashboard/SQL (service role).
create table public.site_updates (
  id bigint generated always as identity primary key,
  title text not null,
  body text not null,
  url text not null default '/#home',
  created_at timestamptz not null default now()
);
alter table public.site_updates enable row level security;
create policy "members read" on public.site_updates for select to authenticated using (true);
create policy "lockdown no anon" on public.site_updates as restrictive for all to anon using (false) with check (false);
grant select on public.site_updates to authenticated;

create trigger push_site_updates after insert on public.site_updates
  for each row execute function public.notify_push();
