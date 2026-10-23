-- The push function can take more than pg_net's default 5 s on a cold start: wait up to 30 s.
-- push_events.target lets a manual event target part of the team (e.g. 'others').
alter table public.push_events add column if not exists target text;

create or replace function public.notify_push()
 returns trigger
 language plpgsql
 security definer
 set search_path to ''
as $function$
begin
  perform net.http_post(
    url := 'https://dykofnyhwusghfowfxbi.supabase.co/functions/v1/send-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5a29mbnlod3VzZ2hmb3dmeGJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwNjUwOTQsImV4cCI6MjEwNzY0MTA5NH0.wLS75UXlm2evHg1mlvjvrlJASDP9KRaE_b8fhnJ8htI',
      'x-push-secret', (select value from public.tt_config where name = 'push_secret')),
    body := jsonb_build_object('table', TG_TABLE_NAME, 'record', to_jsonb(NEW)),
    timeout_milliseconds := 30000
  );
  return NEW;
end $function$;
