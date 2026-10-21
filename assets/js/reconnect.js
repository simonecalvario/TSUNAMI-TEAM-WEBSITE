/* Reconnect: home cities on a map, members living close to each other, "I'll be in <city>" pings. */
(function () {
  const sec = document.getElementById('reconnect'); if (!sec || !window.L) return;
  const $ = id => document.getElementById(id), esc = TT.esc, enc = TT.enc, api = TT.api;
  const NEAR = 250;
  let email = null, nk = [], profs = [], pings = [], map = null, layer = null;
  const name = e => (nk.find(x => x.email === e) || {}).nickname || 'A member';
  const today = new Date().toISOString().slice(0, 10);
  const day = d => new Date(d + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

  // City search (OpenStreetMap), shared by both forms.
  function cityPicker(holder, onPick) {
    holder.innerHTML = '<input type="search" placeholder="Search a city…" autocomplete="off"><ul class="rc-res"></ul>';
    const inp = holder.querySelector('input'), ul = holder.querySelector('ul'); let t, found = [];
    inp.addEventListener('input', function () {
      clearTimeout(t); const q = inp.value.trim();
      if (q.length < 3) { ul.innerHTML = ''; return; }
      t = setTimeout(async function () {
        try {
          const r = await fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&accept-language=en&featuretype=city&q=' + enc(q));
          const j = await r.json();
          found = j.map(x => { const a = x.address || {}; return { city: a.city || a.town || a.village || a.municipality || x.name, country: a.country || '', lat: +x.lat, lng: +x.lon }; }).filter(p => p.city);
          ul.innerHTML = found.map((p, i) => '<li data-i="' + i + '">' + esc(p.city) + (p.country ? ', ' + esc(p.country) : '') + '</li>').join('') || '<li>No results</li>';
        } catch (e) { ul.innerHTML = '<li>Search unavailable right now.</li>'; }
      }, 450);
    });
    ul.addEventListener('click', function (e) { const li = e.target.closest('[data-i]'); if (!li) return; const p = found[+li.dataset.i]; ul.innerHTML = ''; inp.value = p.city + (p.country ? ', ' + p.country : ''); onPick(p); });
  }

  function homeView() {
    const me = profs.find(p => p.email === email), box = $('rc-home');
    if (me && me.city && !box.dataset.edit) {
      box.innerHTML = '<p class="rc-me">📍 <b>' + esc(me.city) + '</b>' + (me.country ? ', ' + esc(me.country) : '') + '</p><button type="button" class="vote-del" data-a="edit" style="margin:0">Change</button> <button type="button" class="vote-del" data-a="clear">Remove</button>' +
        '<p class="vote-hint">Only the city is shared with the crew, never your address.</p>';
      return;
    }
    box.innerHTML = '<div id="rc-home-pick"></div><p class="vote-hint">Only the city is shared with the crew, never your address.</p>';
    cityPicker($('rc-home-pick'), async function (p) {
      delete box.dataset.edit;
      await TT.profile.save({ city: p.city, country: p.country, lat: p.lat, lng: p.lng });
    });
  }
  let pick = null;
  function pingView() {
    const box = $('rc-ping');
    box.innerHTML = '<div id="rc-ping-pick"></div><div class="rc-dates"><label>From <input type="date" id="rc-from" min="' + today + '" value="' + today + '"></label><label>To <input type="date" id="rc-to" min="' + today + '" value="' + today + '"></label></div>' +
      '<input id="rc-note" maxlength="200" placeholder="Note (optional): “free for a beer on Friday!”"><button type="button" class="button" id="rc-send">Tell the crew</button><span id="rc-msg" class="vote-hint"></span>';
    cityPicker($('rc-ping-pick'), p => { pick = p; });
    $('rc-from').addEventListener('change', function () { if ($('rc-to').value < this.value) $('rc-to').value = this.value; $('rc-to').min = this.value; });
    $('rc-send').onclick = async function () {
      if (!email) return;
      if (!pick) { $('rc-msg').textContent = 'Choose a city first.'; return; }
      this.disabled = true;
      try {
        await api.insert('travel_pings', { email: email, nickname: name(email), city: pick.city, country: pick.country || null, lat: pick.lat, lng: pick.lng, from_date: $('rc-from').value, to_date: $('rc-to').value, note: $('rc-note').value.trim() || null });
        pick = null; pingView(); $('rc-msg').textContent = 'Sent! 🌊 The crew nearby has been told.'; load();
      } catch (e) { $('rc-msg').textContent = 'Could not send, check the dates.'; this.disabled = false; }
    };
  }

  function lists() {
    const me = profs.find(p => p.email === email), mine = me && me.lat != null ? [me.lat, me.lng] : null;
    $('rc-trips').innerHTML = pings.length ? pings.map(p => {
      const near = mine && p.email !== email && TT.km(mine, [p.lat, p.lng]) <= NEAR;
      return '<div class="rc-trip' + (near ? ' near' : '') + '"><b>' + esc(name(p.email)) + '</b> → ' + esc(p.city) + (p.country ? ', ' + esc(p.country) : '') +
        '<small>' + day(p.from_date) + (p.to_date !== p.from_date ? ' – ' + day(p.to_date) : '') + (near ? ' · 📍 near you!' : '') + (p.note ? ' · ' + esc(p.note) : '') + '</small>' +
        (p.email === email ? '<button type="button" class="ti-x" data-rm="' + p.id + '" aria-label="Remove">✕</button>' : '') + '</div>';
    }).join('') : '<p class="vote-hint">No trips announced. Going somewhere? Tell the crew!</p>';
    const homes = profs.filter(p => p.lat != null), pairs = [];
    for (let i = 0; i < homes.length; i++) for (let j = i + 1; j < homes.length; j++) {
      const d = TT.km([homes[i].lat, homes[i].lng], [homes[j].lat, homes[j].lng]);
      if (d <= NEAR) pairs.push({ a: homes[i], b: homes[j], d: d });
    }
    pairs.sort((x, y) => x.d - y.d);
    $('rc-near').innerHTML = pairs.length ? pairs.map(p => '<div class="rc-trip' + (p.a.email === email || p.b.email === email ? ' near' : '') + '"><b>' + esc(name(p.a.email)) + '</b> & <b>' + esc(name(p.b.email)) + '</b><small>' + (p.d < 15 ? 'Same city: ' + esc(p.a.city) : Math.round(p.d) + ' km apart · ' + esc(p.a.city) + ' – ' + esc(p.b.city)) + '</small></div>').join('')
      : '<p class="vote-hint">' + (homes.length < 2 ? 'Add your home city to see who lives near you.' : 'Nobody lives within ' + NEAR + ' km of each other… yet!') + '</p>';
  }
  function drawMap() {
    if (!map) {
      map = L.map('rc-map', { zoomControl: true, scrollWheelZoom: false }).setView([42, 10], 3);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 12, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
      layer = L.layerGroup().addTo(map);
    }
    layer.clearLayers();
    const g = {};
    profs.filter(p => p.lat != null).forEach(p => { const k = p.city + '|' + p.country; (g[k] = g[k] || { p: p, who: [] }).who.push(name(p.email) + (p.email === email ? ' (you)' : '')); });
    Object.values(g).forEach(x => L.marker([x.p.lat, x.p.lng], { icon: L.divIcon({ className: '', html: '<div class="rc-pin">🏠<b>' + x.who.length + '</b></div>', iconSize: [40, 26], iconAnchor: [20, 13] }) })
      .bindPopup('<strong>' + esc(x.p.city) + '</strong><br>' + x.who.map(esc).join(', ')).addTo(layer));
    pings.forEach(p => L.marker([p.lat, p.lng], { icon: L.divIcon({ className: '', html: '<div class="rc-pin trip">✈️</div>', iconSize: [30, 26], iconAnchor: [15, 13] }) })
      .bindPopup('<strong>' + esc(name(p.email)) + '</strong> in ' + esc(p.city) + '<br>' + day(p.from_date) + (p.to_date !== p.from_date ? ' – ' + day(p.to_date) : '')).addTo(layer));
  }
  async function load() {
    pings = (await api.get('travel_pings?select=*&to_date=gte.' + today + '&order=from_date.asc')) || [];
    lists(); if (map) drawMap();
  }
  sec.addEventListener('click', async function (e) {
    const a = e.target.closest('[data-a]');
    if (a && a.dataset.a === 'edit') { $('rc-home').dataset.edit = '1'; homeView(); return; }
    if (a && a.dataset.a === 'clear' && confirm('Remove your home city?')) { TT.profile.save({ city: null, country: null, lat: null, lng: null }); return; }
    const rm = e.target.closest('[data-rm]');
    if (rm && confirm('Remove this trip?')) { await api.remove('travel_pings?id=eq.' + rm.dataset.rm + '&email=eq.' + enc(email)).catch(() => {}); load(); }
  });
  TT.when('profiles', function (rows) { profs = rows || []; if (email !== null) { homeView(); lists(); if (map) drawMap(); } });
  Promise.all([TT.identity(), TT.nicks()]).then(function (r) {
    email = r[0]; nk = r[1]; homeView(); pingView(); load();
    const go = () => { drawMap(); setTimeout(() => map.invalidateSize(), 80); };
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en, o) { if (en.some(x => x.isIntersecting)) { o.disconnect(); go(); } }).observe($('rc-map'));
    else go();
  });
  window.addEventListener('resize', function () { if (map) map.invalidateSize(); });
})();
