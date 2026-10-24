-- Tag call signs in the meeting gallery photos; the tagged member gets a push.
create table public.photo_tags (
  photo_id uuid not null references public.meeting_photos(id) on delete cascade,
  email text not null,
  tagged_by text not null default public.tt_me(),
  meeting text,
  created_at timestamptz not null default now(),
  primary key (photo_id, email)
);
alter table public.photo_tags enable row level security;
create policy "members read" on public.photo_tags for select to authenticated using (true);
create policy "tag as me" on public.photo_tags for insert to authenticated with check (tagged_by = public.tt_me());
-- A tag can be removed by who added it, by who is tagged, or by the owner of the photo.
create policy "untag" on public.photo_tags for delete to authenticated using (
  tagged_by = public.tt_me() or email = public.tt_me()
  or exists (select 1 from public.meeting_photos p where p.id = photo_id and p.email = public.tt_me()));
create policy "lockdown no anon" on public.photo_tags as restrictive for all to anon using (false) with check (false);
grant select, insert, delete on public.photo_tags to authenticated;

create trigger push_photo_tags after insert on public.photo_tags
  for each row execute function public.notify_push();
