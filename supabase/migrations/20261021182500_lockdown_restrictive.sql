-- Applied 2026-10-21 after /api/token was confirmed working on the live site.
-- Lockdown without dropping anything: restrictive policies are ANDed with the old open ones.
do $$
declare t text;
begin
  -- No access at all without a member token.
  for t in select tablename from pg_tables where schemaname = 'public' and rowsecurity loop
    execute format('create policy "lockdown no anon" on public.%I as restrictive for all to anon using (false) with check (false)', t);
  end loop;
  -- booster_* had open policies for every role: members may only write their own rows.
  foreach t in array array['booster_favs','booster_reads'] loop
    execute format('create policy "lockdown own insert" on public.%I as restrictive for insert to authenticated with check (email = public.tt_me())', t);
    execute format('create policy "lockdown own update" on public.%I as restrictive for update to authenticated using (email = public.tt_me()) with check (email = public.tt_me())', t);
    execute format('create policy "lockdown own remove" on public.%I as restrictive for delete to authenticated using (email = public.tt_me())', t);
  end loop;
end $$;
create policy "lockdown no anon upload" on storage.objects as restrictive for insert to anon with check (false);
-- A new table must get its own "lockdown no anon" policy (or simply no anon policies).
