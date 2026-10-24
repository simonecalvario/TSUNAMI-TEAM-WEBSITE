-- The precise place of a photo (gallery photos and Blog post photos), set by whoever posted it.
alter table public.meeting_photos add column if not exists place text, add column if not exists place_lat double precision, add column if not exists place_lng double precision;
alter table public.posts add column if not exists place text, add column if not exists place_lat double precision, add column if not exists place_lng double precision;
