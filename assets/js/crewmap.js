/* Passport → Crew map: every member's face where they are now (home city, or a shared stay),
   the distances between us, and "I'll be at …" stays for holidays, trips and events. */
(function () {
  const el = document.getElementById('cm-map'); if (!el || !window.L) return;
  const $ = id => document.getElementById(id), esc = TT.esc, enc = TT.enc, api = TT.api;
  const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const today = iso(new Date());
  const day = d => new Date(d + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const km = n => Math.round(n).toLocaleString('en-GB') + ' km';
  let email = null, nk = [], profs = [], stays = [], map = null, layer = null, focus = null;

  const nameOf = e => (nk.find(x => x.email === e) || {}).nickname || 'A member';
  const member = e => TT.MEMBERS.find(m => m[1].toLowerCase() === String(nameOf(e)).toLowerCase());
  const photo = e => { const m = member(e); return m ? 'assets/images/founders/' + m[0].toLowerCase() + '.jpg' : null; };
  // Where the face is in each founder poster: centre x, centre y (fractions), face width (fraction), height/width.
  const FACES = {
    antonio: [0.49, 0.22, 0.19, 1.5], biagio: [0.47, 0.30, 0.17, 1.5], carlos: [0.36, 0.26, 0.15, 1.5], donato: [0.52, 0.21, 0.19, 1.5],
    francesco: [0.54, 0.17, 0.18, 1.5], marcos: [0.48, 0.25, 0.2, 1.5], massimo: [0.49, 0.24, 0.2, 1.5], pietro: [0.46, 0.27, 0.15, 1.5],
    rinaldo: [0.49, 0.24, 0.18, 1.067], salvatore: [0.49, 0.24, 0.12, 1.2], saskia: [0.47, 0.22, 0.2, 1.067], simone: [0.53, 0.21, 0.22, 1.066], tessa: [0.44, 0.29, 0.2, 1.067]
  };
  // A round crop of the face, `size` px wide.
  function face(e, size) {
    const m = member(e), src = photo(e);
    if (!src) return '<span>' + esc(String(nameOf(e)).slice(0, 1)) + '</span>';
    const f = FACES[m[0].toLowerCase()] || [0.5, 0.25, 0.2, 1.5], W = Math.round(size * 0.7 / f[2]), H = Math.round(W * f[3]);
    return '<img src="' + esc(src) + '" alt="" style="width:' + W + 'px;height:' + H + 'px;left:' + Math.round(size / 2 - f[0] * W) + 'px;top:' + Math.round(size / 2 - f[1] * H) + 'px">';
  }

  // Where each member is today: an active stay wins over the home city.
  function where() {
    const out = {};
    profs.filter(p => p.lat != null).forEach(p => { out[p.email] = { e: p.email, lat: p.lat, lng: p.lng, place: p.city, home: true }; });
    stays.filter(s => s.from_date <= today && s.to_date >= today).forEach(s => {
      out[s.email] = { e: s.email, lat: s.lat, lng: s.lng, place: s.city, home: false, until: s.to_date, note: s.note };
    });
    return Object.values(out);
  }

  function icon(e, me) {
    return L.divIcon({ className: '', html: '<div class="cm-pin' + (me ? ' me' : '') + '">' + face(e, 40) + '</div>', iconSize: [44, 44], iconAnchor: [22, 22], popupAnchor: [0, -22] });
  }

  function draw() {
    if (!map) {
      map = L.map(el, { scrollWheelZoom: false }).setView([45, 10], 4);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 12, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
      layer = L.layerGroup().addTo(map);
    }
    layer.clearLayers();
    const W = where(), me = W.find(w => w.e === email), from = W.find(w => w.e === focus) || me;
    // Lines from the selected member (you, by default) to everyone else, with the distance.
    if (from) W.filter(w => w.e !== from.e).forEach(w => {
      const d = TT.km([from.lat, from.lng], [w.lat, w.lng]); if (d < 1) return;
      L.polyline([[from.lat, from.lng], [w.lat, w.lng]], { color: '#27b8ff', weight: 1.5, opacity: .55, dashArray: '4 6' })
        .bindTooltip(km(d), { permanent: W.length <= 6, direction: 'center', className: 'cm-km' }).addTo(layer);
    });
    // Members in the same place are fanned out a little so every face stays tappable.
    const seen = {};
    W.forEach(w => {
      const k = w.lat.toFixed(2) + ',' + w.lng.toFixed(2), i = seen[k] = (seen[k] || 0) + 1, off = (i - 1) * 0.12;
      const d = me && w.e !== email ? TT.km([me.lat, me.lng], [w.lat, w.lng]) : null;
      const pop = '<div class="cm-pop"><div class="cm-face">' + face(w.e, 72) + '</div><b>' + esc(nameOf(w.e)) + (w.e === email ? ' (you)' : '') + '</b>' +
        '<span>' + (w.home ? '🏠 ' : '✈️ ') + esc(w.place) + (w.home ? '' : ' until ' + day(w.until)) + '</span>' +
        (w.note ? '<span>' + esc(w.note) + '</span>' : '') + (d != null ? '<span>📏 ' + km(d) + ' from you</span>' : '') +
        '<button type="button" data-cm-focus="' + esc(w.e) + '">Distances from ' + (w.e === email ? 'me' : esc(nameOf(w.e))) + '</button>' +
        (member(w.e) ? '<a href="#founders" data-cm-card="' + esc(member(w.e)[1]) + '">See profile →</a>' : '') + '</div>';
      L.marker([w.lat + off * 0.6, w.lng + off], { icon: icon(w.e, w.e === email) }).bindPopup(pop).addTo(layer);
    });
    if (W.length && !draw.fitted) { draw.fitted = true; map.fitBounds(L.latLngBounds(W.map(w => [w.lat, w.lng])).pad(0.3), { maxZoom: 6 }); }
    dist(W, from);
  }

  function dist(W, from) {
    const box = $('cm-dist');
    if (!from) { box.innerHTML = W.length ? '<p class="vote-hint">Add your city below to see how far you are from everyone.</p>' : '<p class="vote-hint">Nobody is on the map yet. Add your city below!</p>'; return; }
    const rows = W.filter(w => w.e !== from.e).map(w => ({ w: w, d: TT.km([from.lat, from.lng], [w.lat, w.lng]) })).sort((a, b) => a.d - b.d);
    box.innerHTML = '<div class="cm-h">📏 Distances from <b>' + (from.e === email ? 'you' : esc(nameOf(from.e))) + '</b> · ' + (from.home ? '🏠 ' : '✈️ ') + esc(from.place) +
      (from.e !== email && W.some(w => w.e === email) ? ' <button type="button" data-cm-focus="' + esc(email) + '">back to me</button>' : '') + '</div>' +
      (rows.length ? '<ul>' + rows.map(r => '<li><span>' + esc(nameOf(r.w.e)) + ' <small>' + (r.w.home ? '🏠 ' : '✈️ ') + esc(r.w.place) + '</small></span><b>' + (r.d < 15 ? 'same city' : km(r.d)) + '</b></li>').join('') + '</ul>' : '<p class="vote-hint">Nobody else on the map yet.</p>');
  }

  /* ---- "I'll be at …" ---- */
  let pick = null, found = [], t = null;
  function stayForm() {
    $('cm-stay').innerHTML = '<input type="search" id="cm-q" placeholder="Where? Search a place…" autocomplete="off"><ul class="pc-res" id="cm-res"></ul>' +
      '<div class="cm-dates"><label>From <input type="date" id="cm-from" min="' + today + '" value="' + today + '"></label><label>To <input type="date" id="cm-to" min="' + today + '" value="' + today + '"></label></div>' +
      '<input id="cm-note" maxlength="200" placeholder="What is it? (optional: holiday, festival, work trip…)"><button type="button" class="button" id="cm-save">Share</button><span id="cm-msg" class="vote-hint"></span>';
  }
  function staysList() {
    const mine = stays.filter(s => s.to_date >= today).sort((a, b) => a.from_date.localeCompare(b.from_date));
    $('cm-stays').innerHTML = mine.length ? '<h4>Coming up</h4>' + mine.map(s => '<div class="cm-st' + (s.from_date <= today ? ' now' : '') + '"><b>' + esc(nameOf(s.email)) + '</b> → ' + esc(s.city) + (s.country ? ', ' + esc(s.country) : '') +
      '<small>' + (s.from_date <= today ? 'now · until ' + day(s.to_date) : day(s.from_date) + (s.to_date !== s.from_date ? ' – ' + day(s.to_date) : '')) + (s.note ? ' · ' + esc(s.note) : '') + '</small>' +
      (s.email === email ? '<button type="button" class="ti-x" data-cm-rm="' + s.id + '" aria-label="Remove">✕</button>' : '') + '</div>').join('') : '';
  }

  async function load() {
    stays = (await api.get('travel_pings?select=*&to_date=gte.' + today + '&order=from_date.asc')) || [];
    staysList(); if (map) draw();
  }

  document.addEventListener('input', function (e) {
    if (e.target.id !== 'cm-q') return;
    clearTimeout(t); pick = null; const q = e.target.value.trim(), ul = $('cm-res');
    if (q.length < 3) { ul.innerHTML = ''; return; }
    t = setTimeout(async function () {
      try {
        const r = await fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&accept-language=en&q=' + enc(q));
        found = (await r.json()).map(x => { const a = x.address || {}; return { city: a.city || a.town || a.village || a.municipality || x.name, country: a.country || '', lat: +x.lat, lng: +x.lon }; }).filter(p => p.city);
        ul.innerHTML = found.map((p, i) => '<li data-i="' + i + '">' + esc(p.city) + (p.country ? ', ' + esc(p.country) : '') + '</li>').join('') || '<li>No results</li>';
      } catch (x) { ul.innerHTML = '<li>Search unavailable right now.</li>'; }
    }, 450);
  });
  document.addEventListener('change', function (e) {
    if (e.target.id === 'cm-from' && $('cm-to').value < e.target.value) { $('cm-to').value = e.target.value; $('cm-to').min = e.target.value; }
  });
  document.addEventListener('click', async function (e) {
    const t0 = e.target.closest && e.target; if (!t0) return;
    const li = t0.closest('#cm-res [data-i]');
    if (li) { pick = found[+li.dataset.i]; $('cm-res').innerHTML = ''; $('cm-q').value = pick.city + (pick.country ? ', ' + pick.country : ''); return; }
    if (t0.id === 'cm-save') {
      if (!email) return;
      if (!pick) { $('cm-msg').textContent = 'Choose a place from the list first.'; return; }
      t0.disabled = true;
      try {
        await api.insert('travel_pings', { email: email, nickname: nameOf(email), city: pick.city, country: pick.country || null, lat: pick.lat, lng: pick.lng, from_date: $('cm-from').value, to_date: $('cm-to').value, note: $('cm-note').value.trim() || null });
        pick = null; stayForm(); $('cm-msg').textContent = 'Shared ✓ The map shows it on those days.'; load();
      } catch (x) { $('cm-msg').textContent = 'Could not save, check the dates.'; t0.disabled = false; }
      return;
    }
    const rm = t0.closest('[data-cm-rm]');
    if (rm && confirm('Remove this stay?')) { await api.remove('travel_pings?id=eq.' + rm.dataset.cmRm + '&email=eq.' + enc(email)).catch(() => {}); load(); return; }
    const f = t0.closest('[data-cm-focus]');
    if (f) { focus = f.dataset.cmFocus === email ? null : f.dataset.cmFocus; if (map) map.closePopup(); draw(); return; }
    const card = t0.closest('[data-cm-card]');
    if (card) {
      e.preventDefault();
      const c = Array.prototype.find.call(document.querySelectorAll('.founder-card'), x => ((x.querySelector('.callsign') || {}).textContent || '').toLowerCase().indexOf(card.dataset.cmCard.toLowerCase()) > -1);
      location.hash = '#founders';
      setTimeout(function () {
        if (!c) return;
        c.scrollIntoView({ block: 'center', behavior: 'smooth' });
        if (!c.classList.contains('open')) { const b = c.querySelector('.fc-more'); if (b) b.click(); }
        c.classList.remove('cm-flash'); void c.offsetWidth; c.classList.add('cm-flash');
      }, 250);
    }
  });

  TT.when('profiles', function (rows) { profs = rows || []; if (map) draw(); });
  Promise.all([TT.identity(), TT.nicks()]).then(function (r) {
    email = r[0]; nk = r[1]; stayForm(); load();
    const go = () => { draw(); setTimeout(() => map.invalidateSize(), 80); };
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en, o) { if (en.some(x => x.isIntersecting)) { o.disconnect(); go(); } }).observe(el);
    else go();
  });
  window.addEventListener('resize', function () { if (map) map.invalidateSize(); });
})();
