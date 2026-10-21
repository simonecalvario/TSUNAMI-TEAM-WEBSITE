/*
 * Tsunami Team API Worker – route: www.tsunamiteambeliquid.com/api/*
 *
 * GET /api/token
 *   Cloudflare Access has already logged the member in and adds its signed JWT
 *   (Cf-Access-Jwt-Assertion). We pass it to the Supabase function "access-token",
 *   which verifies it and returns a 1-hour database session for that member.
 *   No settings or secrets are needed here.
 *
 * GET /api/whoami
 *   Shows the (non-secret) audience and team of the Access login, to configure access-token.
 */
const FN = 'https://dykofnyhwusghfowfxbi.supabase.co/functions/v1/access-token';

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
});

function cookie(req, name) {
  const m = (req.headers.get('Cookie') || '').match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
  return m ? m[1] : null;
}

export default {
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === '/api/token' && req.method === 'GET') {
      const jwt = req.headers.get('Cf-Access-Jwt-Assertion') || cookie(req, 'CF_Authorization');
      if (!jwt) return json({ error: 'not signed in' }, 401);
      const r = await fetch(FN, { headers: { 'x-access-jwt': jwt } });
      return new Response(await r.text(), { status: r.status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
    }
    if (url.pathname === '/api/whoami' && req.method === 'GET') {
      const jwt = req.headers.get('Cf-Access-Jwt-Assertion') || cookie(req, 'CF_Authorization');
      if (!jwt) return json({ error: 'not signed in' }, 401);
      try {
        const p = JSON.parse(atob(jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        return json({ aud: p.aud, team: p.iss, email: p.email });
      } catch (e) { return json({ error: 'unreadable' }, 400); }
    }
    return json({ error: 'not found' }, 404);
  }
};
