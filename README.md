# TSUNAMI-TEAM-WEBSITE
Website to manage the TSUNAMI TEAM PROJECT

## How the site is built

- Static pages on GitHub Pages (`www.tsunamiteambeliquid.com`), behind Cloudflare Access (login).
- Data, photos and push notifications on Supabase (project `dykofnyhwusghfowfxbi`).
- `index.html` holds the markup; styles are in `assets/css/`, behaviour in `assets/js/` (one file per feature).
- `assets/js/tt-core.js` is loaded first on every page: shared config (`TT.MEETINGS`, `TT.MEMBERS`, `TT.LIQUIDS`) and helpers.
- `gallery.html?m=<key>` is the gallery of every meeting (`doha.html` etc. redirect there).

### Common changes

- **A new Tsunami Meeting is over**: add one line to `TT.MEETINGS` in `assets/js/tt-core.js` and a pin image in `assets/images/pins/<key>.png`. Map, Passport, Journey, Memorabilia and galleries pick it up.
- **After editing CSS/JS**: run `tools/bump-build.sh` so installed apps reload the new version.

## Security setup (member identity)

How it works: Cloudflare Access logs the member in → the Worker in `worker/` (route `/api/*`) forwards
the Access login to the Supabase function `access-token` → that function checks it and returns a
1-hour database session for the member's email → `tt-core.js` attaches it to every request.

One-time steps:

1. **Create the Worker** (Cloudflare dashboard → Workers & Pages → Create → Worker "tsunami-api" → Edit code →
   paste `worker/src/index.js` → Deploy), then Settings → Domains & Routes → Add route
   `www.tsunamiteambeliquid.com/api/*` on zone `tsunamiteambeliquid.com`.
   (Or add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as GitHub secrets and run the "Deploy API Worker" action.)
2. **Audience** (done): `ACCESS_AUD` and `ACCESS_TEAM` at the top of `supabase/functions/access-token/index.ts` come from `/api/whoami`; redeploy the function if the Access application changes.
3. **Check**: open `https://www.tsunamiteambeliquid.com/api/token` → it must show `{"token":"…","exp":…}`.
4. **Lock the database** (done on 2026-10-21, `20261021182500_lockdown_restrictive.sql`): without a member token
   nothing can be read or written, and every member can change only their own content.
   When you add a table, give it member policies like the others and no anon access.

`supabase/migrations/optional_cleanup_triggers.sql` (optional) removes others' comments and reactions when a photo or post is deleted.
