/* Passport: a booklet you swipe through.
   My passport: cover → data page (photo, call sign, birthday and city you can edit, level, badges) → visa pages
   with the Tsunami Meeting logo stamped in ink for every meeting you lived.
   Team passports: the same booklet for every other member, read only. */
(function () {
  const own = document.getElementById('pbook'); if (!own) return;
  const esc = TT.esc, enc = TT.enc;
  const MO = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const INK = ['#c8102e', '#1d4ed8', '#047857', '#7c3aed', '#b45309', '#0e7490'], GHOST = '#6b5a33';
  const PER_PAGE = 4;
  const hash = t => { let h = 7; for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) >>> 0; return h; };
  const mrz = (t, n) => (String(t || '').toUpperCase().normalize('NFD').replace(/[^A-Z0-9]+/g, '<') + '<'.repeat(n)).slice(0, n);
  let profs = [], team = [], me = null, busy = false;

  /* ---- the meeting logo as a rubber stamp: ink colour, grain and worn patches (drawn once per colour) ---- */
  const inkCache = {};
  function inked(key, col) {
    const id = key + col;
    if (!inkCache[id]) inkCache[id] = new Promise(function (ok) {
      const img = new Image();
      img.onload = function () {
        try {
          const w = 260, h = Math.round(w * img.height / img.width), c = document.createElement('canvas'); c.width = w; c.height = h;
          const x = c.getContext('2d'); x.drawImage(img, 0, 0, w, h);
          const d = x.getImageData(0, 0, w, h), p = d.data, rgb = [1, 3, 5].map(i => parseInt(col.slice(i, i + 2), 16));
          let s = hash(id) % 2147483646 + 1; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
          for (let i = 0; i < p.length; i += 4) {
            const lum = (0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2]) / 255, n = rnd();
            let a = Math.min(1, Math.max(0, (1 - lum) * 1.25 - 0.05)) * p[i + 3] / 255;
            if (n < 0.08) a *= 0.15; else if (n < 0.2) a *= 0.7;
            p[i] = rgb[0]; p[i + 1] = rgb[1]; p[i + 2] = rgb[2]; p[i + 3] = Math.round(a * 235);
          }
          x.putImageData(d, 0, 0);
          x.globalCompositeOperation = 'destination-out';
          for (let k = 0; k < 6; k++) {
            const cx = rnd() * w, cy = rnd() * h, r = 20 + rnd() * 50, g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
            g.addColorStop(0, 'rgba(0,0,0,.45)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(cx - r, cy - r, 2 * r, 2 * r);
          }
          ok(c.toDataURL('image/png'));
        } catch (e) { ok(null); }
      };
      img.onerror = () => ok(null);
      img.src = 'assets/images/pins/' + key + '.png';
    });
    return inkCache[id];
  }
  function inkify(root) {
    root.querySelectorAll('img[data-ink]').forEach(function (im) {
      const k = im.dataset.ink.split('|');
      inked(k[0], k[1]).then(function (u) { if (u) { im.src = u; im.classList.remove('raw'); } });
    });
  }
  const logo = (m, col, cls) => '<img class="ink raw' + (cls ? ' ' + cls : '') + '" data-ink="' + m.key + '|' + col + '" src="assets/images/pins/' + m.key + '.png" alt="' + esc(m.name) + ' stamp">';

  /* ---- one booklet: my passport (editable) or a team member's (read only) ---- */
  function Book(el, dots, mine) {
    const B = { el: el, dots: dots, mine: mine, P: null, page: 0, edit: null, found: [], dirty: false };
    const cityOf = () => { const r = profs.find(x => B.P && x.email === B.P.email); return r && r.city ? r : null; };

    function field(k, label, value, empty) {
      if (!mine) return '<div><label>' + label + '</label><b>' + esc(value || '—') + '</b></div>';
      return '<button type="button" class="pb-f' + (value ? '' : ' add') + '" data-pe-open="' + k + '"' + (value ? ' data-set="1"' : '') + '><label>' + label + ' <i>✎</i></label><b>' + esc(value || empty) + '</b></button>';
    }
    function editor() {
      if (B.edit === 'bd') {
        const bd = B.P.bd || { day: 1, month: 1 };
        return '<div class="pb-edit"><label>Your birthday · only day and month are shown</label><div class="pb-er">' +
          '<select id="pe-d" aria-label="Day">' + Array.from({ length: 31 }, (_, i) => '<option' + (i + 1 === bd.day ? ' selected' : '') + '>' + (i + 1) + '</option>').join('') + '</select>' +
          '<select id="pe-m" aria-label="Month">' + MONTHS.map((x, i) => '<option value="' + (i + 1) + '"' + (i + 1 === bd.month ? ' selected' : '') + '>' + x + '</option>').join('') + '</select></div>' +
          '<div class="pb-er"><button type="button" class="pb-ok" data-pe="bd-save">Save</button>' + (B.P.bd ? '<button type="button" data-pe="bd-del">Remove</button>' : '') + '<button type="button" data-pe="x">Cancel</button></div><span class="pb-msg" id="pe-msg"></span></div>';
      }
      if (B.edit === 'city') {
        return '<div class="pb-edit"><label>Your city · the team sees only the city</label>' +
          '<input type="search" id="pe-q" placeholder="Search your city…" autocomplete="off"><ul class="pc-res" id="pe-res"></ul>' +
          '<div class="pb-er">' + (cityOf() ? '<button type="button" data-pe="city-del">Remove</button>' : '') + '<button type="button" data-pe="x">Cancel</button></div><span class="pb-msg" id="pe-msg"></span></div>';
      }
      return '';
    }
    function dataPage() {
      const P = B.P, m = TT.MEMBERS.find(x => x[1].toLowerCase() === String(P.nick || '').toLowerCase());
      const first = m ? m[0] : (P.nick || 'Member'), no = 'TT' + String(hash(P.email || 'x') % 1000000).padStart(6, '0');
      const c = cityOf(), bd = P.bd ? P.bd.day + ' ' + MO[P.bd.month - 1] : '';
      const pct = P.next ? Math.round((P.xp - P.level.xp) / (P.next.xp - P.level.xp) * 100) : 100;
      const stamps = TT.MEETINGS.filter(x => P.att.some(a => a.email === P.email && a.meeting === x.key)).length;
      return '<div class="pb-page pb-data">' +
        '<div class="pb-top"><span>TSUNAMI TEAM</span><span>PASSPORT · PASSEPORT</span></div>' +
        '<div class="pb-id"><div class="pb-photo">' + TT.face(P.nick, 104) + '</div><div class="pb-fields">' +
        '<label>Name</label><b>' + esc(first) + '</b>' +
        '<label>Call sign</label><b class="cs">' + esc(P.nick || '—') + '</b>' +
        '<div class="pb-two"><div><label>Passport no.</label><b>' + no + '</b></div><div><label>Stamps</label><b>' + stamps + ' / ' + TT.MEETINGS.length + '</b></div></div>' +
        '</div></div>' +
        '<div class="pb-two pb-ff">' + field('bd', 'Birthday', bd, '+ Add') + field('city', 'Home', c ? c.city : '', '+ Add your city') + '</div>' +
        editor() +
        '<div class="pb-lvl"><span class="ic">' + P.level.ic + '</span><div><label>Level</label><b>' + esc(P.level.n) + ' · ' + P.xp + ' XP</b>' +
        '<div class="pb-bar"><i style="width:' + pct + '%"></i></div><small>' + (P.next ? (P.next.xp - P.xp) + ' XP to ' + P.next.ic + ' ' + esc(P.next.n) : 'Top level reached') + '</small></div></div>' +
        '<label class="pb-lab">Badges unlocked · ' + P.badges.length + '</label>' +
        '<div class="pb-badges">' + (P.badges.length ? P.badges.map(b => '<span title="' + esc(b.n + (b.tier ? ' ' + b.tier : '')) + '">' + b.ic + (b.tier ? '<i>' + b.tier + '</i>' : '') + '</span>').join('') : '<em>' + (mine ? 'No badges yet: they arrive with everything you do on the site.' : 'No badges yet.') + '</em>') + '</div>' +
        '<a class="pb-more" href="#badgebook">All badges, levels &amp; Team XP →</a>' +
        '<div class="pb-mrz">P&lt;TSU' + esc(mrz(first + '<<' + (P.nick || ''), 39)) + '<br>' + esc(mrz(no + 'TSU' + (P.bd ? String(P.bd.month).padStart(2, '0') + String(P.bd.day).padStart(2, '0') : '0000') + 'LIQUID', 44)) + '</div>' +
        '</div>';
    }
    function stamp(m, i) {
      const P = B.P, on = P.att.some(a => a.email === P.email && a.meeting === m.key), tag = mine ? 'button type="button"' : 'div', end = mine ? 'button' : 'div';
      if (!on) return '<' + tag + ' class="stamp slot" data-k="' + m.key + '">' + logo(m, GHOST, 'ghost') + '<b>' + esc(m.name) + ' ' + m.year + '</b><small>' + (mine ? 'Were you there? Tap to stamp' : 'Not stamped') + '</small></' + end + '>';
      const h = hash(m.key + (P.email || '')), rot = (h % 25) - 12, ink = INK[i % INK.length];
      return '<' + tag + ' class="stamp on" data-k="' + m.key + '" style="--ink:' + ink + ';transform:rotate(' + rot + 'deg)"' + (mine ? ' title="Tap to remove the stamp"' : '') + '>' +
        logo(m, ink) + '<b>' + esc(m.name.toUpperCase()) + ' · ' + m.year + '</b><small>✦ ADMITTED ✦</small></' + end + '>';
    }
    B.render = function (force) {
      if (!B.P) return;
      // Don't wipe what is being typed: render again when the editor closes.
      if (!force && B.edit && el.contains(document.activeElement)) { B.dirty = true; return; }
      B.dirty = false;
      const pages = mine ? ['<div class="pb-page pb-cover" data-pb-open="1"><div class="pb-emb"><img src="finaltsunami%20team%20%20sticker.png" alt=""></div><b>TSUNAMI TEAM</b><span>PASSPORT</span><small>Friendship is liquid</small><em>Tap to open</em></div>'] : [];
      pages.push(dataPage());
      const list = TT.MEETINGS.map((m, i) => stamp(m, i));
      if (mine) list.push('<div class="stamp slot next"><span>🔜</span><b>Next Tsunami Meeting</b><small>Your next stamp</small></div>');
      for (let i = 0; i < list.length; i += PER_PAGE) {
        pages.push('<div class="pb-page pb-visa"><div class="pb-top"><span>VISAS · STAMPS</span><span>' + (Math.floor(i / PER_PAGE) + 2) + '</span></div><div class="pb-grid">' + list.slice(i, i + PER_PAGE).join('') + '</div></div>');
      }
      const keep = el.scrollLeft;
      el.innerHTML = pages.join('');
      el.scrollLeft = keep;
      dots.innerHTML = pages.map((_, i) => '<i data-pb-go="' + i + '" class="' + (i === B.page ? 'on' : '') + '"></i>').join('');
      if (mine && !B.P.ok) el.insertAdjacentHTML('beforeend', '<p class="vote-hint">The passport could not be loaded right now. It will retry shortly.</p>');
      inkify(el);
    };
    B.go = function (i, instant) {
      const pages = el.querySelectorAll('.pb-page'); if (!pages.length) return;
      i = Math.max(0, Math.min(pages.length - 1, i));
      el.scrollTo({ left: pages[i].offsetLeft - el.offsetLeft, behavior: instant ? 'auto' : 'smooth' });
    };
    B.data = mine ? 1 : 0;
    el.addEventListener('scroll', function () {
      const w = el.clientWidth || 1, i = Math.round(el.scrollLeft / w);
      if (i !== B.page) { B.page = i; dots.querySelectorAll('i').forEach((d, k) => d.classList.toggle('on', k === i)); }
    }, { passive: true });
    el._book = B; dots._book = B;
    return B;
  }

  const mine = Book(own, document.getElementById('pb-dots'), true);
  const tbEl = document.getElementById('tbook'), other = tbEl ? Book(tbEl, document.getElementById('tb-dots'), false) : null;
  const bookOf = n => { const w = n.closest('.pbook-wrap'); return w ? w.querySelector('.pbook')._book : null; };

  /* ---- editing birthday and city on my data page ---- */
  function openEdit(k) {
    mine.edit = k; mine.render(true); mine.go(1, true);
    const f = document.getElementById(k === 'city' ? 'pe-q' : 'pe-d');
    if (f) setTimeout(function () { try { f.focus({ preventScroll: true }); } catch (x) {} }, 60);
  }
  function closeEdit() { mine.edit = null; mine.found = []; mine.render(); }
  const msg = t => { const m = document.getElementById('pe-msg'); if (m) m.textContent = t; };
  async function saveBd(del) {
    if (!me) return;
    try {
      if (del) await TT.api.remove('birthdays?email=eq.' + enc(me));
      else await TT.api.upsert('birthdays', { email: me, nickname: mine.P.nick || 'A member', day: +document.getElementById('pe-d').value, month: +document.getElementById('pe-m').value }, 'email');
    } catch (x) { msg('Could not save right now, try again.'); return; }
    closeEdit();
    if (window.ttReloadPass) window.ttReloadPass();
    if (window.ttBdays) window.ttBdays();
  }
  async function saveCity(p) {
    if (!TT.profile) return;
    msg('Saving…');
    try { await TT.profile.save(p ? { city: p.city, country: p.country, lat: p.lat, lng: p.lng } : { city: null, country: null, lat: null, lng: null }); }
    catch (x) { msg('Could not save right now, try again.'); return; }
    closeEdit();
  }
  let t = null;
  document.addEventListener('input', function (e) {
    if (e.target.id !== 'pe-q') return;
    clearTimeout(t); const q = e.target.value.trim(), ul = document.getElementById('pe-res');
    if (q.length < 2) { ul.innerHTML = ''; return; }
    t = setTimeout(async function () {
      try {
        const r = await fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&accept-language=en&featuretype=settlement&q=' + enc(q));
        const seen = {};
        mine.found = (await r.json()).map(x => { const a = x.address || {}; return { city: a.city || a.town || a.village || a.municipality || x.name, country: a.country || '', lat: +x.lat, lng: +x.lon }; })
          .filter(p => p.city && !seen[p.city + p.country] && (seen[p.city + p.country] = 1));
        ul.innerHTML = mine.found.map((p, i) => '<li data-i="' + i + '">📍 ' + esc(p.city) + (p.country ? ', ' + esc(p.country) : '') + '</li>').join('') || '<li>No results</li>';
      } catch (x) { ul.innerHTML = '<li>Search unavailable right now.</li>'; }
    }, 400);
  });

  /* ---- team passports: pick a member ---- */
  let sel = null;
  function renderTeam() {
    const box = document.getElementById('tp-list'); if (!box || !other) return;
    const list = team.filter(p => p.email !== me).sort((a, b) => String(a.nick || '').localeCompare(String(b.nick || '')));
    if (!list.length) { box.innerHTML = '<p class="vote-hint">No other passports yet.</p>'; tbEl.closest('.pbook-wrap').hidden = true; return; }
    tbEl.closest('.pbook-wrap').hidden = false;
    if (!sel || !list.some(p => p.email === sel)) sel = list[0].email;
    box.innerHTML = list.map(p => {
      const n = TT.MEETINGS.filter(x => p.att.some(a => a.email === p.email && a.meeting === x.key)).length;
      return '<button type="button" class="tp' + (p.email === sel ? ' on' : '') + '" data-tp="' + esc(p.email) + '"><span class="tp-f">' + TT.face(p.nick, 40) + '</span><b>' + esc(p.nick || 'A member') + '</b><small>' + p.level.ic + ' · 🛂 ' + n + '</small></button>';
    }).join('');
    other.P = list.find(p => p.email === sel); other.render();
  }

  document.addEventListener('click', async function (e) {
    const T = e.target; if (!T.closest) return;
    const nav = T.closest('[data-pb]'); if (nav) { const b = bookOf(nav); if (b) b.go(b.page + (+nav.dataset.pb)); return; }
    const dot = T.closest('[data-pb-go]'); if (dot) { const b = dot.parentNode._book; if (b) b.go(+dot.dataset.pbGo); return; }
    if (T.closest('[data-pb-open]')) { mine.go(1); return; }
    const tp = T.closest('[data-tp]'); if (tp) { sel = tp.dataset.tp; renderTeam(); other.go(0, true); return; }
    const op = T.closest('#pbook [data-pe-open]'); if (op) { mine.edit === op.dataset.peOpen ? closeEdit() : openEdit(op.dataset.peOpen); return; }
    const li = T.closest('#pe-res [data-i]'); if (li) { const p = mine.found[+li.dataset.i]; if (p) saveCity(p); return; }
    const pe = T.closest('#pbook [data-pe]');
    if (pe) {
      const a = pe.dataset.pe;
      if (a === 'x') closeEdit();
      else if (a === 'bd-save') saveBd(false);
      else if (a === 'bd-del') saveBd(true);
      else if (a === 'city-del') saveCity(null);
      return;
    }
    const b = T.closest('#pbook .stamp[data-k]'); if (!b || busy || !mine.P || !mine.P.email) return;
    const k = b.dataset.k, has = mine.P.att.some(a => a.email === mine.P.email && a.meeting === k);
    if (has && !confirm('Remove this stamp from your passport?')) return;
    busy = true; b.disabled = true;
    try {
      if (has) await TT.api.remove('attendance?email=eq.' + enc(mine.P.email) + '&meeting=eq.' + k);
      else await TT.api.upsert('attendance', { email: mine.P.email, meeting: k }, 'email,meeting');
    } catch (x) {}
    busy = false;
    if (window.ttReloadPass) window.ttReloadPass();
  });
  document.addEventListener('focusout', function () {
    setTimeout(function () { if (mine.dirty && !own.contains(document.activeElement)) mine.render(); }, 0);
  });
  document.addEventListener('keydown', function (e) {
    if (!/Arrow(Left|Right)/.test(e.key) || /INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '')) return;
    [mine, other].forEach(function (b) {
      if (!b || !b.el.offsetParent) return;
      const r = b.el.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
      b.go(b.page + (e.key === 'ArrowRight' ? 1 : -1));
    });
  });

  window.ttPass = {
    edit: function (k) { openEdit(k); own.scrollIntoView({ block: 'center', behavior: 'smooth' }); },
    page: function (i) { mine.go(i); own.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
  };
  TT.identity().then(function (e) { me = e; renderTeam(); });
  TT.when('passport', function (d) { mine.P = d; mine.render(); });
  TT.when('team', function (list) { team = list || []; renderTeam(); });
  TT.when('profiles', function (rows) { profs = rows || []; mine.render(); if (other && other.P) other.render(); });
})();
