import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

const esc = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const km = (a: number[], b: number[]) => {
  const r = Math.PI / 180, dLat = (b[0] - a[0]) * r, dLng = (b[1] - a[1]) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
};
const day = (d: string) => new Date(d + "T12:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short" });

Deno.serve(async (req) => {
  if (req.headers.get("x-push-secret") !== Deno.env.get("PUSH_SECRET")) return new Response("no", { status: 401 });
  const { table, record } = await req.json();
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  webpush.setVapidDetails(Deno.env.get("VAPID_SUBJECT")!, Deno.env.get("VAPID_PUBLIC_KEY")!, Deno.env.get("VAPID_PRIVATE_KEY")!);

  const to = new Map<string, { title: string; body: string; url: string }>();
  const clip = (t: string) => (t || "").slice(0, 120);

  if (table === "chat_messages") {
    const { data: nicks } = await sb.from("nicknames").select("email,nickname");
    for (const n of nicks || []) {
      if (n.email === record.email) continue;
      if (new RegExp("@" + esc(n.nickname) + "(?![\\p{L}\\p{N}])", "iu").test(record.body))
        to.set(n.email, { title: record.nickname + " mentioned you", body: clip(record.body), url: "/#lagoon" });
    }
    if (record.reply_to) {
      const { data: o } = await sb.from("chat_messages").select("email").eq("id", record.reply_to).maybeSingle();
      if (o && o.email !== record.email && !to.has(o.email))
        to.set(o.email, { title: record.nickname + " replied to you", body: clip(record.body), url: "/#lagoon" });
    }
  } else if (table === "comments") {
    let target: string | null = null, what = "commented on your post";
    if (record.parent_id) {
      const { data: c } = await sb.from("comments").select("email").eq("id", record.parent_id).maybeSingle();
      target = c?.email ?? null; what = "replied to your comment";
    } else {
      const { data: p } = await sb.from("posts").select("email").eq("id", record.post_id).maybeSingle();
      target = p?.email ?? null;
    }
    if (target && target !== record.email) to.set(target, { title: record.author + " " + what, body: clip(record.body), url: "/#blog" });
  } else if (table === "travel_pings") {
    // Reconnect: tell the members who live near the city.
    const { data: profs } = await sb.from("profiles").select("email,lat,lng,city");
    for (const p of profs || []) {
      if (p.email === record.email || p.lat == null || p.lng == null) continue;
      if (km([p.lat, p.lng], [record.lat, record.lng]) > 250) continue;
      const when = record.from_date === record.to_date ? day(record.from_date) : day(record.from_date) + " – " + day(record.to_date);
      to.set(p.email, { title: "🌊 " + (record.nickname || "A member") + " is coming to " + record.city, body: when + (record.note ? " · " + clip(record.note) : "") + " · Time to reconnect?", url: "/#reconnect" });
    }
  }

  let sent = 0;
  for (const [email, msg] of to) {
    const { data: subs } = await sb.from("push_subscriptions").select("*").eq("email", email);
    for (const s of subs || []) {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(msg), { TTL: 86400 });
        sent++;
      } catch (e: any) {
        if (e.statusCode === 404 || e.statusCode === 410) await sb.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
      }
    }
  }
  return new Response(JSON.stringify({ sent }), { headers: { "Content-Type": "application/json" } });
});
