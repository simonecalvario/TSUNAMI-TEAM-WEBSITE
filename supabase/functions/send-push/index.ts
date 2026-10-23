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
  } else if (table === "posts") {
    // A new Blog post: everyone but the author.
    const { data: nicks } = await sb.from("nicknames").select("email");
    for (const n of nicks || []) if (n.email !== record.email)
      to.set(n.email, { title: "📖 New on the Blog: " + clip(record.title || "a new post"), body: (record.author || "A member") + " published a new post. Read it, react and comment.", url: "/#blog" });
  } else if (table === "site_updates") {
    // Something new on the site (a section, a feature): the whole team.
    const { data: nicks } = await sb.from("nicknames").select("email");
    for (const n of nicks || []) to.set(n.email, { title: "🆕 " + clip(record.title), body: clip(record.body), url: record.url || "/#home" });
  } else if (table === "birthday_waves") {
    // Tell the birthday member when the team has filled the energy bar (two thirds of the others), and again if everyone joined.
    const { data: nicks } = await sb.from("nicknames").select("email,nickname");
    const others = (nicks || []).filter((n) => n.email !== record.bday_email).length;
    const need = boostNeed(others);
    const { count } = await sb.from("birthday_waves").select("email", { count: "exact", head: true }).eq("bday_email", record.bday_email).eq("year", record.year);
    if (count === need) {
      to.set(record.bday_email, { title: "⚡ Your Birthday Boost is ready!", body: "The team filled your energy bar. Open it now 🎂", url: "/#home" });
      const nm = (nicks || []).find((n) => n.email === record.bday_email)?.nickname || "A member";
      for (const n of nicks || []) if (n.email !== record.bday_email)
        to.set(n.email, { title: "⚡ " + nm + "’s Birthday Boost is unlocked!", body: "The team filled the energy bar. See all the waves and messages on the home page 🎂", url: "/#home" });
    }
    else if (count === others && others > need) to.set(record.bday_email, { title: "🌐 Full team!", body: "Every single member sent you a birthday wave 🌊", url: "/#home" });
  } else if (table === "push_events" && record.kind === "birthday_morning") {
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Rome" }));
    if (now.getHours() !== 9) return new Response(JSON.stringify({ skipped: "not 9 in Rome" }));
    const { data: bds } = await sb.from("birthdays").select("email,day,month").eq("day", now.getDate()).eq("month", now.getMonth() + 1);
    const { data: nicks } = await sb.from("nicknames").select("email,nickname");
    const nameOf = (e: string) => (nicks || []).find((n) => n.email === e)?.nickname || "a member";
    for (const b of bds || []) {
      to.set(b.email, { title: "🎂 Happy birthday, " + nameOf(b.email) + "!", body: "The whole Tsunami Team is with you today. Your team is charging your Birthday Boost ⚡", url: "/#home" });
      for (const n of nicks || []) {
        if (n.email === b.email || to.has(n.email)) continue;
        to.set(n.email, { title: "🎂 Today is " + nameOf(b.email) + "’s birthday!", body: "Send your wave 🌊 from the home page and help fill the Birthday Boost.", url: "/#home" });
      }
    }
  } else if (table === "push_events" && record.kind === "birthday_evening") {
    // 21:00: the Birthday Boost opens anyway for whoever did not reach two thirds of the team.
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Rome" }));
    if (now.getHours() !== 21 && !record.target) return new Response(JSON.stringify({ skipped: "not 21 in Rome" }));
    const { data: bds } = await sb.from("birthdays").select("email").eq("day", now.getDate()).eq("month", now.getMonth() + 1);
    const { data: nicks } = await sb.from("nicknames").select("email,nickname");
    for (const b of bds || []) {
      const others = (nicks || []).filter((n) => n.email !== b.email).length;
      const { count } = await sb.from("birthday_waves").select("email", { count: "exact", head: true }).eq("bday_email", b.email).eq("year", now.getFullYear());
      if ((count || 0) >= boostNeed(others)) continue; // already unlocked and notified
      // The rest of the team: the Boost is open for everyone to see, and there is still time to wave.
      const nm = (nicks || []).find((n) => n.email === b.email)?.nickname || "A member";
      for (const n of nicks || []) if (n.email !== b.email && !to.has(n.email))
        to.set(n.email, { title: "⚡ " + nm + "’s Birthday Boost is open!", body: "See the waves and messages from the team on the home page. There is still time to send yours 🌊", url: "/#home" });
      if (record.target === "others") continue;
      to.set(b.email, { title: "⚡ Your Birthday Boost is here!", body: (count ? count + " member" + (count > 1 ? "s" : "") + " sent you a wave and a few words." : "Your team is with you today.") + " Open it with your quote of the day 🎂", url: "/#home" });
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
  console.log(JSON.stringify({ table, kind: record.kind, to: to.size, sent }));
  return new Response(JSON.stringify({ sent }), { headers: { "Content-Type": "application/json" } });
});
