/* "On this day": adds a memory from the same day in past years to the Daily Booster. */
(function () {
  const md = d => { const x = new Date(d); return (x.getMonth() + 1) + '-' + x.getDate(); };
  const now = new Date(), key = md(now), year = now.getFullYear(), esc = TT.esc;
  let memo = null;
  async function find() {
    if (memo) return memo;
    const [ph, chat] = await Promise.all([
      TT.api.get('meeting_photos?select=email,meeting,image_url,created_at&order=created_at.asc'),
      TT.api.get('chat_messages?select=nickname,body,created_at&order=id.asc&limit=5000')
    ]);
    const old = r => md(r.created_at) === key && new Date(r.created_at).getFullYear() < year;
    const p = (ph || []).filter(old), c = (chat || []).filter(old).filter(m => m.body.length > 12);
    const seed = Math.floor(Date.now() / 864e5);
    memo = p.length ? { t: 'p', r: p[seed % p.length] } : c.length ? { t: 'c', r: c[seed % c.length] } : { t: '' };
    return memo;
  }
  async function add(pop) {
    if (!pop.querySelector('.bq-tag') || pop.querySelector('.bq-otd')) return;
    const m = await find(); if (!m.t || !document.body.contains(pop) || pop.querySelector('.bq-otd')) return;
    const y = year - new Date(m.r.created_at).getFullYear(), ago = y + ' year' + (y > 1 ? 's' : '') + ' ago today';
    const nk = await TT.nicks(), who = e => (nk.find(x => x.email === e) || {}).nickname || 'A member';
    const mt = TT.MEETINGS.find(x => x.key === m.r.meeting);
    const el = document.createElement('a'); el.className = 'bq-otd';
    if (m.t === 'p') { el.href = 'gallery.html?m=' + m.r.meeting; el.innerHTML = '<img src="' + esc(m.r.image_url) + '" alt=""><span><small>📅 ' + ago + '</small>' + esc(who(m.r.email)) + ' shared a photo' + (mt ? ' from ' + esc(mt.name) : '') + '</span>'; }
    else { el.href = '#lagoon'; el.innerHTML = '<span><small>📅 ' + ago + ' in the Lagoon</small><b>' + esc(m.r.nickname) + ':</b> “' + esc(m.r.body.slice(0, 120)) + '”</span>'; }
    const tag = pop.querySelector('.bq-tag'); tag.parentNode.insertBefore(el, tag.nextSibling);
  }
  new MutationObserver(function () { const p = document.getElementById('boost-pop'); if (p) add(p); }).observe(document.body, { childList: true, subtree: true });
})();
