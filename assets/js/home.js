/* Home: a soft mosaic of meeting photos behind the hero and the "Latest wave" strip. */
(function () {
  const hero = document.querySelector('.hero'), cont = document.querySelector('.hero-content');
  if (!hero || !cont) return;
  const esc = TT.esc;
  const bg = document.createElement('div'); bg.className = 'hero-photos'; bg.setAttribute('aria-hidden', 'true');
  hero.insertBefore(bg, hero.firstChild);
  const strip = document.createElement('div'); strip.className = 'wave-strip'; strip.id = 'wave-strip';
  cont.appendChild(strip);

  const ago = t => {
    const s = Math.max(1, (Date.now() - new Date(t).getTime()) / 1000);
    return s < 3600 ? Math.round(s / 60) + ' min ago' : s < 86400 ? Math.round(s / 3600) + ' h ago' : Math.round(s / 86400) + ' d ago';
  };
  const mName = k => (TT.MEETINGS.find(m => m.key === k) || { name: 'a meeting' }).name;
  let next = null, D = null;

  function card(href, ic, k, body) { return '<a class="ws-c" href="' + href + '"><i>' + ic + '</i><span><small>' + k + '</small>' + body + '</span></a>'; }
  function render() {
    if (!D) return;
    const name = e => (D.nk.find(x => x.email === e) || {}).nickname || 'A member', out = [];
    if (next && next.first) {
      const d = Math.ceil((next.first - Date.now()) / 864e5);
      out.push(card('#meetings', '⏳', 'Next Tsunami Meeting', d > 0 ? '<b>' + d + ' day' + (d > 1 ? 's' : '') + '</b> to ' + esc(next.city || 'go') : '<b>It’s happening!</b> ' + esc(next.city || '')));
    } else if (next && next.city) out.push(card('#meetings', '🗳', 'Leading the vote', '<b>' + esc(next.city) + '</b> · vote the dates'));
    else out.push(card('#meetings', '🗳', 'Where to next?', '<b>Vote the city</b> of the next meeting'));
    const ph = D.ph[0];
    if (ph) out.push(card('gallery.html?m=' + ph.meeting, '📸', 'Latest photo · ' + ago(ph.created_at), '<b>' + esc(name(ph.email)) + '</b> in ' + esc(mName(ph.meeting))));
    const m = D.chat[0];
    if (m) out.push(card('#lagoon', '💬', 'Lagoon · ' + ago(m.created_at), '<b>' + esc(m.nickname) + ':</b> ' + esc(String(m.body).slice(0, 48)) + (m.body.length > 48 ? '…' : '')));
    const ctr = new Set(TT.MEETINGS.map(x => x.cc)).size;
    out.push(card('#journey', '🧭', 'Our journey', '<b>' + TT.MEETINGS.length + ' meetings</b> · ' + ctr + ' countries'));
    strip.innerHTML = '<div class="ws-h">🌊 The latest wave</div><div class="ws-r">' + out.join('') + '</div>';
  }
  function mosaic(photos) {
    if (!photos.length || bg.childElementCount) return;
    const pick = photos.slice().sort(() => Math.random() - 0.5);
    const n = Math.min(24, Math.max(12, pick.length));
    let h = ''; for (let i = 0; i < n; i++) h += '<span style="background-image:url(\'' + encodeURI(pick[i % pick.length].image_url).replace(/'/g, '%27') + '\')"></span>';
    bg.innerHTML = h;
  }
  async function load() {
    const [nk, ph, chat] = await Promise.all([
      TT.nicks(), TT.api.get('meeting_photos?select=email,meeting,image_url,created_at&order=created_at.desc&limit=60'),
      TT.api.get('chat_messages?select=nickname,body,created_at&order=id.desc&limit=1')
    ]);
    D = { nk: nk, ph: ph || [], chat: chat || [] };
    mosaic(D.ph); render();
  }
  TT.when('next', n => { next = n; render(); });
  load(); setInterval(function () { if (!document.hidden) load(); }, 60000);
})();
