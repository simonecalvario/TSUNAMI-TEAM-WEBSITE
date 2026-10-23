/* Passport → My passport: a booklet you swipe through.
   Cover → data page (photo, call sign, birthday, city, level, badges) → visa pages with a stamp per Tsunami Meeting. */
(function () {
  const book = document.getElementById('pbook'); if (!book) return;
  const esc = TT.esc, enc = TT.enc;
  const MO = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const INK = ['#c8102e', '#1d4ed8', '#047857', '#7c3aed', '#b45309', '#0e7490'];
  const PER_PAGE = 4;
  const hash = t => { let h = 7; for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) >>> 0; return h; };
  let P = null, city = null, page = 0, busy = false;

  const mrz = (t, n) => (String(t || '').toUpperCase().normalize('NFD').replace(/[^A-Z0-9]+/g, '<') + '<'.repeat(n)).slice(0, n);

  function dataPage() {
    const m = TT.MEMBERS.find(x => x[1].toLowerCase() === String(P.nick || '').toLowerCase());
    const first = m ? m[0] : (P.nick || 'Member'), no = 'TT' + String(hash(P.email || 'x') % 1000000).padStart(6, '0');
    const bd = P.bd ? P.bd.day + ' ' + MO[P.bd.month - 1] : '—';
    const pct = P.next ? Math.round((P.xp - P.level.xp) / (P.next.xp - P.level.xp) * 100) : 100;
    const stamps = TT.MEETINGS.filter(x => P.att.some(a => a.email === P.email && a.meeting === x.key)).length;
    return '<div class="pb-page pb-data">' +
      '<div class="pb-top"><span>TSUNAMI TEAM</span><span>PASSPORT · PASSEPORT</span></div>' +
      '<div class="pb-id"><div class="pb-photo">' + TT.face(P.nick, 104) + '</div><div class="pb-fields">' +
      '<label>Name</label><b>' + esc(first) + '</b>' +
      '<label>Call sign</label><b class="cs">' + esc(P.nick || '—') + '</b>' +
      '<div class="pb-two"><div><label>Birthday</label><b>' + esc(bd) + '</b></div><div><label>Home</label><b>' + esc(city || '—') + '</b></div></div>' +
      '<div class="pb-two"><div><label>Passport no.</label><b>' + no + '</b></div><div><label>Stamps</label><b>' + stamps + ' / ' + TT.MEETINGS.length + '</b></div></div>' +
      '</div></div>' +
      '<div class="pb-lvl"><span class="ic">' + P.level.ic + '</span><div><label>Level</label><b>' + esc(P.level.n) + ' · ' + P.xp + ' XP</b>' +
      '<div class="pb-bar"><i style="width:' + pct + '%"></i></div><small>' + (P.next ? (P.next.xp - P.xp) + ' XP to ' + P.next.ic + ' ' + esc(P.next.n) : 'Top level reached') + '</small></div></div>' +
      '<label class="pb-lab">Badges unlocked · ' + P.badges.length + '</label>' +
      '<div class="pb-badges">' + (P.badges.length ? P.badges.map(b => '<span title="' + esc(b.n + (b.tier ? ' ' + b.tier : '')) + '">' + b.ic + (b.tier ? '<i>' + b.tier + '</i>' : '') + '</span>').join('') : '<em>No badges yet: they arrive with everything you do on the site.</em>') + '</div>' +
      '<a class="pb-more" href="#badgebook">All badges &amp; how to earn them →</a>' +
      '<div class="pb-mrz">P&lt;TSU' + esc(mrz(first + '<<' + (P.nick || ''), 39)) + '<br>' + esc(mrz(no + 'TSU' + (P.bd ? String(P.bd.month).padStart(2, '0') + String(P.bd.day).padStart(2, '0') : '0000') + 'LIQUID', 44)) + '</div>' +
      '</div>';
  }

  function stamp(m, i) {
    const on = P.att.some(a => a.email === P.email && a.meeting === m.key);
    if (!on) return '<button type="button" class="stamp slot" data-k="' + m.key + '"><span>' + m.icon + '</span><b>' + esc(m.name) + ' ' + m.year + '</b><small>Were you there?<br>Tap to stamp</small></button>';
    const h = hash(m.key), rot = (h % 25) - 12, ink = INK[i % INK.length], shape = ['round', 'rect', 'oval'][h % 3];
    return '<button type="button" class="stamp on ' + shape + '" data-k="' + m.key + '" style="--ink:' + ink + ';transform:rotate(' + rot + 'deg)" title="Tap to remove the stamp">' +
      '<small>TSUNAMI MEETING</small><b>' + esc(m.name.toUpperCase()) + '</b><span>' + m.icon + ' ' + m.year + '</span><small>✦ ADMITTED ✦</small></button>';
  }

  function render() {
    if (!P) return;
    const pages = ['<div class="pb-page pb-cover" data-pb-open="1"><div class="pb-emb"><img src="finaltsunami%20team%20%20sticker.png" alt=""></div><b>TSUNAMI TEAM</b><span>PASSPORT</span><small>Friendship is liquid</small><em>Tap to open</em></div>', dataPage()];
    const list = TT.MEETINGS.map((m, i) => stamp(m, i)).concat(['<div class="stamp slot next"><span>🔜</span><b>Next Tsunami Meeting</b><small>Your next stamp</small></div>']);
    for (let i = 0; i < list.length; i += PER_PAGE) {
      const n = pages.length - 1;
      pages.push('<div class="pb-page pb-visa"><div class="pb-top"><span>VISAS · STAMPS</span><span>' + n + '</span></div><div class="pb-grid">' + list.slice(i, i + PER_PAGE).join('') + '</div></div>');
    }
    const keep = book.scrollLeft;
    book.innerHTML = pages.join('');
    book.scrollLeft = keep;
    document.getElementById('pb-dots').innerHTML = pages.map((_, i) => '<i data-pb-go="' + i + '" class="' + (i === page ? 'on' : '') + '"></i>').join('');
    if (!P.ok) book.insertAdjacentHTML('beforeend', '<p class="vote-hint">The passport could not be loaded right now. It will retry shortly.</p>');
  }

  function go(i) {
    const pages = book.querySelectorAll('.pb-page'); i = Math.max(0, Math.min(pages.length - 1, i));
    book.scrollTo({ left: pages[i].offsetLeft - book.offsetLeft, behavior: 'smooth' });
  }
  book.addEventListener('scroll', function () {
    const w = book.clientWidth || 1, i = Math.round(book.scrollLeft / w);
    if (i !== page) { page = i; document.querySelectorAll('#pb-dots i').forEach((d, k) => d.classList.toggle('on', k === i)); }
  }, { passive: true });
  document.addEventListener('click', async function (e) {
    const nav = e.target.closest && e.target.closest('[data-pb]'); if (nav) { go(page + (+nav.dataset.pb)); return; }
    const dot = e.target.closest && e.target.closest('[data-pb-go]'); if (dot) { go(+dot.dataset.pbGo); return; }
    if (e.target.closest && e.target.closest('[data-pb-open]')) { go(1); return; }
    const b = e.target.closest && e.target.closest('#pbook .stamp[data-k]'); if (!b || busy || !P || !P.email) return;
    const k = b.dataset.k, has = P.att.some(a => a.email === P.email && a.meeting === k);
    if (has && !confirm('Remove this stamp from your passport?')) return;
    busy = true; b.disabled = true;
    try {
      if (has) await TT.api.remove('attendance?email=eq.' + enc(P.email) + '&meeting=eq.' + k);
      else await TT.api.upsert('attendance', { email: P.email, meeting: k }, 'email,meeting');
    } catch (x) {}
    busy = false;
    if (window.ttReloadPass) window.ttReloadPass();
  });
  document.addEventListener('keydown', function (e) {
    if (!book.offsetParent || !/Arrow(Left|Right)/.test(e.key) || /INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '')) return;
    const r = book.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
    go(page + (e.key === 'ArrowRight' ? 1 : -1));
  });

  TT.when('passport', function (d) { P = d; render(); });
  TT.when('profiles', function (rows) {
    TT.identity().then(function (em) { const me = (rows || []).find(r => r.email === em); city = me && me.city ? me.city : null; render(); });
  });
})();
