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

Until this is done, anyone who copies the public Supabase key can read or change the data.

1. **Deploy the Worker** in `worker/` (it serves `/api/token`):
   - In `worker/wrangler.toml`, fill in `ACCESS_TEAM` (Zero Trust team name) and `ACCESS_AUD` (the Access application's AUD tag).
   - In GitHub → Settings → Secrets and variables → Actions, add `CLOUDFLARE_API_TOKEN` (template "Edit Cloudflare Workers"), `CLOUDFLARE_ACCOUNT_ID`, and `SUPABASE_JWT_SECRET` (Supabase → Project Settings → JWT Keys → Legacy JWT secret).
   - Run the "Deploy API Worker" action (or push a change in `worker/`).
2. **Check it**: while logged in, open `https://www.tsunamiteambeliquid.com/api/token`. It must show `{"token":"…","exp":…}`.
3. **Lock the database**: run `supabase/migrations/lockdown_after_worker.sql` in the Supabase SQL editor.
   From then on only signed members can read, and everyone can change only their own content.

The member policies are already in place (migration `20261021150000_…`), so step 3 is the only switch.
`supabase/migrations/optional_cleanup_triggers.sql` (optional) removes others' comments and reactions when a photo or post is deleted.
