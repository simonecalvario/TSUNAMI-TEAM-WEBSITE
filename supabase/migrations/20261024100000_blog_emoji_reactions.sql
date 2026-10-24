-- Blog reactions become emojis (👍 ❤️ 😂 😮 😢 😡), one per member per post/comment.
-- value stays for older code (always 1 now); existing likes become 👍.
alter table public.reactions add column if not exists emoji text;
update public.reactions set emoji = '👍' where emoji is null and value > 0;
