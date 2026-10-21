-- PHASE 2 – run ONLY after /api/token works on the live site
-- (open the site, then https://www.tsunamiteambeliquid.com/api/token must show {"token":...}).
-- Removes the old "anyone can do anything" policies: from then on only signed members
-- can read, and each member can change only their own rows.

do $$
declare p record;
begin
  for p in select schemaname, tablename, policyname from pg_policies
           where schemaname = 'public' and (roles && array['anon','public']::name[])
  loop
    execute format('drop policy %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;
end $$;

drop policy if exists "upload blog images" on storage.objects;
-- Images stay publicly readable by URL (the bucket is public), only uploads need a member.

-- Nobody without a member token can call the capsule counter.
revoke execute on function public.capsule_sealed() from public, anon;
grant execute on function public.capsule_sealed() to authenticated;
