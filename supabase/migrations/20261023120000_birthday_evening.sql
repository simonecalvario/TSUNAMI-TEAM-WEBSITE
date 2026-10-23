-- 21:00 in Rome (19:00 UTC in summer, 20:00 UTC in winter; send-push keeps only the 21:00 one):
-- the Birthday Boost opens anyway and its owner gets a push if two thirds of the team was not reached.
select cron.schedule('tsunami-birthday-evening', '0 19,20 * * *', $$insert into public.push_events(kind) values ('birthday_evening')$$);
