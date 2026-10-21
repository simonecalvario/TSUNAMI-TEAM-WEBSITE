// access-token: turns a Cloudflare Access login into a Supabase session for that member.
// Called by the /api/token Worker, which forwards the Access JWT in `x-access-jwt`.
// ACCESS_AUD: the Access application AUD tag (not secret; read it at /api/whoami). The ACCESS_AUD secret overrides it.
const ACCESS_AUD = "0f56068daa3029168e687d4cccf188327f5e06799e68e2154864d8f3b72baa4f";
// Only logins signed by our Zero Trust team are accepted.
const ACCESS_TEAM = "https://proud-glitter-1ca5.cloudflareaccess.com";
// Self-check: a request whose x-selftest matches a row of public.tt_selftest (service-role only) mints and deletes a test session.
import { createClient } from "npm:@supabase/supabase-js@2";

const URL_ = Deno.env.get("SUPABASE_URL")!;
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
const fromB64u = (s: string) =>
  Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4)), (c) => c.charCodeAt(0));

const certs = new Map<string, { keys: JsonWebKey[]; at: number }>();
async function keysOf(iss: string) {
  const c = certs.get(iss);
  if (c && Date.now() - c.at < 3600e3) return c.keys;
  const r = await fetch(iss + "/cdn-cgi/access/certs");
  if (!r.ok) throw new Error("certs");
  const keys = (await r.json()).keys;
  certs.set(iss, { keys, at: Date.now() });
  return keys;
}

async function verifyAccess(jwt: string | null, aud: string): Promise<string> {
  const [h, p, s] = (jwt || "").split(".");
  if (!s) throw new Error("missing");
  const head = JSON.parse(new TextDecoder().decode(fromB64u(h)));
  const body = JSON.parse(new TextDecoder().decode(fromB64u(p)));
  if (body.iss !== ACCESS_TEAM) throw new Error("issuer");
  const auds = Array.isArray(body.aud) ? body.aud : [body.aud];
  if (!auds.includes(aud)) throw new Error("audience");
  if (!body.exp || body.exp < Date.now() / 1000) throw new Error("expired");
  const jwk = (await keysOf(body.iss)).find((k: any) => k.kid === head.kid);
  if (!jwk || head.alg !== "RS256") throw new Error("kid");
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  if (!(await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, fromB64u(s), new TextEncoder().encode(h + "." + p)))) throw new Error("signature");
  if (!body.email) throw new Error("email");
  return String(body.email).toLowerCase();
}

async function sessionFor(email: string) {
  const admin = createClient(URL_, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false, autoRefreshToken: false } });
  await admin.auth.admin.createUser({ email, email_confirm: true }); // "already registered" is fine
  const { data: link, error: e1 } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (e1 || !link?.properties?.hashed_token) throw new Error("link: " + (e1?.message || "none"));
  const pub = createClient(URL_, Deno.env.get("SUPABASE_ANON_KEY")!, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error: e2 } = await pub.auth.verifyOtp({ token_hash: link.properties.hashed_token, type: "magiclink" });
  if (e2 || !data.session) throw new Error("otp: " + (e2?.message || "none"));
  return { admin, session: data.session };
}

Deno.serve(async (req) => {
  try {
    const st = req.headers.get("x-selftest");
    if (st) {
      const svc = createClient(URL_, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
      const { data: row } = await svc.from("tt_selftest").select("key").eq("key", st).maybeSingle();
      if (!row) return json({ error: "no" }, 401);
      const { admin, session } = await sessionFor("tt-selftest@example.com");
      const claims = JSON.parse(new TextDecoder().decode(fromB64u(session.access_token.split(".")[1])));
      await admin.auth.admin.deleteUser(session.user.id);
      return json({ ok: true, role: claims.role, email: claims.email, exp_in: claims.exp - Math.floor(Date.now() / 1000) });
    }
    const aud = Deno.env.get("ACCESS_AUD") || ACCESS_AUD;
    if (!aud) return json({ error: "ACCESS_AUD not set" }, 503);
    let email: string;
    try { email = await verifyAccess(req.headers.get("x-access-jwt"), aud); }
    catch (e) { return json({ error: "not signed in", why: String((e as Error).message) }, 401); }
    const { session } = await sessionFor(email);
    return json({ token: session.access_token, exp: session.expires_at });
  } catch (e) {
    return json({ error: String((e as Error).message) }, 500);
  }
});
