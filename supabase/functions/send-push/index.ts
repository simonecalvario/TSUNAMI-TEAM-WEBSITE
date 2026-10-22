import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

const esc = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// Public VAPID key used by the site (assets/js/push.js).
const PUB = "BIZygphZe69F81urAeiXeObdY3I781Loy8UN4T6THbGQlNu_bbLDmF86rIvnKqPwBeB5tOWcyvi0_9W6dM1KhM0";
const boostNeed = (others: number) => Math.max(1, Math.ceil(others * 2 / 3));

Deno.serve(async (req) => {
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  // Only the database (notify_push) knows this secret: it lives in public.tt_config, readable by the service role only.
  const given = req.headers.get("x-push-secret") || "";
  const { data: cfg } = await sb.from("tt_config").select("value").eq("name", "push_secret").maybeSingle();
  if (!given || (given !== cfg?.value && given !== Deno.env.get("PUSH_SECRET"))) return new Response("no", { status: 401 });
  const { table, record } = await req.json();
  // Keys pasted with quotes, spaces or "=" padding would make web-push throw.
  const clean = (v: string | undefined) => (v || "").replace(/[\s"'=]/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const subj = (Deno.env.get("VAPID_SUBJECT") || "").trim().replace(/^["']|["']$/g, "");
  const pubK = clean(Deno.env.get("VAPID_PUBLIC_KEY")) || PUB, privK = clean(Deno.env.get("VAPID_PRIVATE_KEY"));
  try { webpush.setVapidDetails(/^(mailto:|https:)/.test(subj) ? subj : "mailto:" + (subj || "tsunamiteambeliquid@gmail.com"), pubK, privK); }
  catch (e) { return new Response(JSON.stringify({ vapid_error: String((e as Error).message), pub_len: pubK.length, priv_len: privK.length, subject_ok: /^(mailto:|https:)/.test(subj) }), { status: 500 }); }
  if (table === "push_events" && record.kind === "ping") return new Response(JSON.stringify({ vapid: "ok", pub_matches_site: clean(Deno.env.get("VAPID_PUBLIC_KEY")) === PUB }));

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
  } else if (table === "birthday_waves") {
    // Tell the birthday member when the crew has filled the energy bar (two thirds of the others), and again if everyone joined.
    const { data: nicks } = await sb.from("nicknames").select("email,nickname");
    const others = (nicks || []).filter((n) => n.email !== record.bday_email).length;
    const need = boostNeed(others);
    const { count } = await sb.from("birthday_waves").select("email", { count: "exact", head: true }).eq("bday_email", record.bday_email).eq("year", record.year);
    if (count === need) to.set(record.bday_email, { title: "⚡ Your Birthday Boost is ready!", body: "The crew filled your energy bar. Open it now 🎂", url: "/#home" });
    else if (count === others && others > need) to.set(record.bday_email, { title: "🌐 Full crew!", body: "Every single member sent you a birthday wave 🌊", url: "/#home" });
  } else if (table === "push_events" && record.kind === "birthday_morning") {
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Rome" }));
    if (now.getHours() !== 9) return new Response(JSON.stringify({ skipped: "not 9 in Rome" }));
    const { data: bds } = await sb.from("birthdays").select("email,day,month").eq("day", now.getDate()).eq("month", now.getMonth() + 1);
    const { data: nicks } = await sb.from("nicknames").select("email,nickname");
    const nameOf = (e: string) => (nicks || []).find((n) => n.email === e)?.nickname || "a member";
    for (const b of bds || []) {
      to.set(b.email, { title: "🎂 Happy birthday, " + nameOf(b.email) + "!", body: "The whole Tsunami Team is with you today. Your crew is charging your Birthday Boost ⚡", url: "/#home" });
      for (const n of nicks || []) {
        if (n.email === b.email || to.has(n.email)) continue;
        to.set(n.email, { title: "🎂 Today is " + nameOf(b.email) + "’s birthday!", body: "Send your wave 🌊 from the home page and help fill the Birthday Boost.", url: "/#home" });
      }
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
