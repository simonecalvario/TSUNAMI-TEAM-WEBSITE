/*
 * Tsunami Team API Worker – runs on www.tsunamiteambeliquid.com/api/*
 *
 * GET /api/token
 *   Cloudflare Access has already logged the member in and adds a signed JWT
 *   (Cf-Access-Jwt-Assertion). We verify it, then return a 1-hour Supabase token
 *   whose `email` claim the database policies use to know who is writing.
 *
 * Settings (wrangler.toml / dashboard):
 *   ACCESS_TEAM          vars    Zero Trust team name (the part before .cloudflareaccess.com)
 *   ACCESS_AUD           vars    Application Audience (AUD) tag of the Access application
 *   SUPABASE_JWT_SECRET  secret  Supabase → Project Settings → JWT Keys → Legacy JWT secret
 */
const TTL = 3600;
let certs = null, certsAt = 0;

const b64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64u = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - s.length % 4) % 4)), c => c.charCodeAt(0));
const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
});

async function accessKeys(team) {
  if (certs && Date.now() - certsAt < 3600e3) return certs;
  const r = await fetch(`https://${team}.cloudflareaccess.com/cdn-cgi/access/certs`);
  if (!r.ok) throw new Error('certs');
  certs = (await r.json()).keys; certsAt = Date.now();
  return certs;
}

async function verifyAccess(jwt, env) {
  const [h, p, s] = (jwt || '').split('.');
  if (!s) throw new Error('missing');
  const head = JSON.parse(new TextDecoder().decode(fromB64u(h)));
  const body = JSON.parse(new TextDecoder().decode(fromB64u(p)));
  const jwk = (await accessKeys(env.ACCESS_TEAM)).find(k => k.kid === head.kid);
  if (!jwk || head.alg !== 'RS256') throw new Error('kid');
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, fromB64u(s), new TextEncoder().encode(h + '.' + p));
  if (!ok) throw new Error('signature');
  const now = Math.floor(Date.now() / 1000);
  const aud = Array.isArray(body.aud) ? body.aud : [body.aud];
  if (body.exp < now || !aud.includes(env.ACCESS_AUD)) throw new Error('claims');
  if (body.iss !== `https://${env.ACCESS_TEAM}.cloudflareaccess.com`) throw new Error('issuer');
  if (!body.email) throw new Error('email');
  return String(body.email).toLowerCase();
}

// Stable UUID per member, so auth.uid() works too.
async function uuidFor(email) {
  const d = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode('tsunami:' + email))).slice(0, 16);
  d[6] = (d[6] & 0x0f) | 0x50; d[8] = (d[8] & 0x3f) | 0x80;
  const x = [...d].map(b => b.toString(16).padStart(2, '0')).join('');
  return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20)}`;
}

async function supabaseToken(email, secret) {
  const now = Math.floor(Date.now() / 1000), exp = now + TTL;
  const enc = o => b64u(new TextEncoder().encode(JSON.stringify(o)));
  const data = enc({ alg: 'HS256', typ: 'JWT' }) + '.' + enc({
    iss: 'tsunami-api', aud: 'authenticated', role: 'authenticated',
    sub: await uuidFor(email), email, iat: now, exp
  });
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return { token: data + '.' + b64u(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))), exp };
}

function cookie(req, name) {
  const m = (req.headers.get('Cookie') || '').match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
  return m ? m[1] : null;
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === '/api/token' && req.method === 'GET') {
      if (!env.ACCESS_TEAM || !env.ACCESS_AUD || !env.SUPABASE_JWT_SECRET) return json({ error: 'not configured' }, 500);
      let email;
      try { email = await verifyAccess(req.headers.get('Cf-Access-Jwt-Assertion') || cookie(req, 'CF_Authorization'), env); }
      catch (e) { return json({ error: 'not signed in' }, 401); }
      return json(await supabaseToken(email, env.SUPABASE_JWT_SECRET));
    }
    return json({ error: 'not found' }, 404);
  }
};
