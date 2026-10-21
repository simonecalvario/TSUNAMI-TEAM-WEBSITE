/* Tsunami Wrapped: your year with the crew, in numbers. */
(function () {
  const box = document.getElementById('wrapped'); if (!box) return;
  const esc = TT.esc, api = TT.api;
  let email = null, nk = [], D = null, year = new Date().getFullYear();
  const name = e => (nk.find(x => x.email === e) || {}).nickname || 'A member';
  const inY = (r, y) => r.created_at && new Date(r.created_at).getFullYear() === y;

  async function load() {
    const a = await Promise.all([
      api.get('attendance?select=email,meeting'), api.get('chat_messages?select=id,email,body,reply_to,created_at&order=id.asc&limit=20000'),
      api.get('meeting_photos?select=id,email,meeting,created_at'), api.get('photo_reactions?select=target,email,created_at&limit=20000'),
      api.get('posts?select=id,email,created_at'), api.get('booster_reads?select=email,day,created_at&limit=20000'),
      api.get('memorabilia?select=email,created_at'), api.get('profiles?select=email,lat,lng')
    ]);
    D = { att: a[0] || [], chat: a[1] || [], ph: a[2] || [], pr: a[3] || [], posts: a[4] || [], boost: a[5] || [], mem: a[6] || [], prof: a[7] || [] };
    render();
  }
  function stats(e, y) {
    const S = {};
    const meet = TT.MEETINGS.filter(m => m.year === y && D.att.some(a => a.email === e && a.meeting === m.key));
    S.meet = meet;
    const home = D.prof.find(p => p.email === e && p.lat != null);
    S.km = home ? meet.reduce((t, m) => t + 2 * TT.km([home.lat, home.lng], m.coords), 0) : 0;
    const msgs = D.chat.filter(m => m.email === e && inY(m, y));
    S.msgs = msgs.length;
    const days = {}; msgs.forEach(m => { const k = new Date(m.created_at).toDateString(); days[k] = (days[k] || 0) + 1; });
    const top = Object.entries(days).sort((a, b) => b[1] - a[1])[0];
    S.topDay = top ? { d: new Date(top[0]), n: top[1] } : null;
    // Chat buddy: most replies exchanged both ways.
    const byId = {}; D.chat.forEach(m => { byId[m.id] = m; });
    const pal = {};
    D.chat.filter(m => inY(m, y) && m.reply_to && byId[m.reply_to]).forEach(m => {
      const o = byId[m.reply_to];
      if (m.email === e && o.email !== e) pal[o.email] = (pal[o.email] || 0) + 1;
      if (o.email === e && m.email !== e) pal[m.email] = (pal[m.email] || 0) + 1;
    });
    const b = Object.entries(pal).sort((x, z) => z[1] - x[1])[0];
    S.buddy = b ? { e: b[0], n: b[1] } : null;
    const myPh = D.ph.filter(p => p.email === e && inY(p, y));
    S.photos = myPh.length;
    const ids = new Set(D.ph.filter(p => p.email === e).map(p => 'p' + p.id));
    S.got = D.pr.filter(r => r.email !== e && ids.has(r.target) && inY(r, y)).length;
    S.posts = D.posts.filter(p => p.email === e && inY(p, y)).length;
    S.mem = D.mem.filter(p => p.email === e && inY(p, y)).length;
    S.boost = D.boost.filter(r => r.email === e && inY(r, y)).length;
    S.score = S.msgs + 5 * S.photos + 10 * S.posts + 10 * S.mem + 20 * meet.length;
    return S;
  }
  function render() {
    if (!D || !email) return;
    const years = Array.from(new Set(D.chat.concat(D.ph).map(r => new Date(r.created_at).getFullYear()).concat(TT.MEETINGS.map(m => m.year), [new Date().getFullYear()]))).filter(Boolean).sort((a, b) => b - a);
    const S = stats(email, year), all = Array.from(new Set(nk.map(n => n.email)));
    const crew = all.map(e => ({ e: e, s: stats(e, year) })).sort((a, b) => b.s.score - a.s.score);
    const crewMsgs = crew.reduce((t, x) => t + x.s.msgs, 0), crewPh = crew.reduce((t, x) => t + x.s.photos, 0);
    const c = (ic, big, txt) => '<div class="wr-c"><i>' + ic + '</i><b>' + big + '</b><span>' + txt + '</span></div>';
    const cards = [];
    if (S.meet.length) cards.push(c('🌊', S.meet.length, 'Tsunami Meeting' + (S.meet.length > 1 ? 's' : '') + ': ' + S.meet.map(m => m.icon + ' ' + esc(m.name)).join(', ')));
    if (S.km) cards.push(c('✈️', Math.round(S.km).toLocaleString('en-GB') + ' km', 'travelled for friendship (from your home city and back)'));
    else if (S.meet.length) cards.push(c('✈️', '? km', 'add your city in the <a href="#passport">Passport</a> to count your kilometres'));
    cards.push(c('💬', S.msgs, 'messages in the Lagoon' + (S.topDay ? '. Your loudest day: ' + S.topDay.d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }) + ' (' + S.topDay.n + ')' : '')));
    if (S.buddy) cards.push(c('🤝', esc(name(S.buddy.e)), 'your chat buddy: ' + S.buddy.n + (S.buddy.n > 1 ? ' replies' : ' reply') + ' exchanged'));
    if (S.photos || S.got) cards.push(c('📸', S.photos, 'photos shared · ' + S.got + ' reactions received'));
    if (S.posts || S.mem) cards.push(c('✍️', S.posts + S.mem, 'stories and memorabilia added'));
    if (S.boost) cards.push(c('🌅', S.boost, 'mornings with the Daily Booster'));
    const rank = crew.findIndex(x => x.e === email) + 1;
    box.innerHTML = '<div class="wr-head"><div><b>' + year + '</b> with the crew</div><select id="wr-y" aria-label="Year">' + years.map(y => '<option' + (y === year ? ' selected' : '') + '>' + y + '</option>').join('') + '</select></div>' +
      '<div class="wr-grid">' + cards.join('') + '</div>' +
      '<p class="wr-crew">The whole crew in ' + year + ': <b>' + crewMsgs + '</b> messages · <b>' + crewPh + '</b> photos · ' + TT.MEETINGS.filter(m => m.year === year).length + ' meeting(s).' +
      (crew[0] && crew[0].s.score ? ' Most active wave: <b>' + esc(name(crew[0].e)) + '</b>' + (rank && crew[0].e !== email ? ' · you are #' + rank : crew[0].e === email ? ' (that’s you! 🏆)' : '') + '.' : '') + '</p>' +
      (navigator.share ? '<button type="button" class="button" id="wr-share">Share my Wrapped</button>' : '');
    document.getElementById('wr-y').onchange = function () { year = +this.value; render(); };
    const sh = document.getElementById('wr-share');
    if (sh) sh.onclick = function () {
      navigator.share({ title: 'My Tsunami ' + year, text: 'My Tsunami ' + year + ' 🌊 ' + S.meet.length + ' meeting(s), ' + (S.km ? Math.round(S.km) + ' km, ' : '') + S.msgs + ' messages, ' + S.photos + ' photos. Friendship is liquid!' }).catch(() => {});
    };
  }
  Promise.all([TT.identity(), TT.nicks()]).then(r => {
    email = r[0]; nk = r[1];
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en, o) { if (en.some(x => x.isIntersecting)) { o.disconnect(); load(); } }, { rootMargin: '200px' }).observe(box);
    else load();
  });
})();
