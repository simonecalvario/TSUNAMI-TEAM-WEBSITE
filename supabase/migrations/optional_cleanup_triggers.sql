-- NOT APPLIED YET (optional). Run it in the Supabase SQL editor when you like.
-- Deleting your photo or post also removes the comments and reactions others left on it.
create or replace function public.tt_photo_cleanup() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.photo_reactions where target = 'p' || old.id::text
     or target in (select 'c' || id::text from public.photo_comments where photo_id = old.id::text);
  delete from public.photo_comments where photo_id = old.id::text;
  return old;
end $$;
create trigger photo_cleanup after delete on public.meeting_photos for each row execute function public.tt_photo_cleanup();

create or replace function public.tt_post_cleanup() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.reactions where target = 'p' || old.id::text
     or target in (select 'c' || id::text from public.comments where post_id = old.id);
  delete from public.comments where post_id = old.id;
  return old;
end $$;
create trigger post_cleanup after delete on public.posts for each row execute function public.tt_post_cleanup();
revoke execute on function public.tt_photo_cleanup(), public.tt_post_cleanup() from public, anon, authenticated;

