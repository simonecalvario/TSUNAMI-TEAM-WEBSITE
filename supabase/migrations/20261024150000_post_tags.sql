-- Tag call signs in the photo of a Blog post; the tagged member gets a push.
create table public.post_tags (
  post_id bigint not null references public.posts(id) on delete cascade,
  email text not null,
  tagged_by text not null default public.tt_me(),
  created_at timestamptz not null default now(),
  primary key (post_id, email)
);
alter table public.post_tags enable row level security;
create policy "members read" on public.post_tags for select to authenticated using (true);
create policy "tag as me" on public.post_tags for insert to authenticated with check (tagged_by = public.tt_me());
-- A tag can be removed by who added it, by who is tagged, or by the author of the post.
create policy "untag" on public.post_tags for delete to authenticated using (
  tagged_by = public.tt_me() or email = public.tt_me()
  or exists (select 1 from public.posts p where p.id = post_id and p.email = public.tt_me()));
create policy "lockdown no anon" on public.post_tags as restrictive for all to anon using (false) with check (false);
grant select, insert, delete on public.post_tags to authenticated;

create trigger push_post_tags after insert on public.post_tags
  for each row execute function public.notify_push();
