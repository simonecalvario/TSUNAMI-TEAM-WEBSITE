/* Tsunami Team – shared config and helpers. Loaded first on every page. */
(function () {
  const BASE = 'https://dykofnyhwusghfowfxbi.supabase.co';
  const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5a29mbnlod3VzZ2hmb3dmeGJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwNjUwOTQsImV4cCI6MjEwNzY0MTA5NH0.wLS75UXlm2evHg1mlvjvrlJASDP9KRaE_b8fhnJ8htI';

  // Every Tsunami Meeting lived so far, oldest first. Add a line here when a new meeting is over.
  const MEETINGS = [
    { key: 'doha', name: 'Doha', country: 'Qatar', cc: 'QA', icon: '🇶🇦', year: 2023, coords: [25.2854, 51.5310], ar: 471 / 406 },
    { key: 'barcelona', name: 'Barcelona', country: 'Spain', cc: 'ES', icon: '🇪🇸', year: 2024, coords: [41.3851, 2.1734], ar: 1088 / 944 },
    { key: 'munich', name: 'Munich', country: 'Germany', cc: 'DE', icon: '🇩🇪', year: 2026, coords: [48.1351, 11.5820], ar: 911 / 765 }
  ];
  const MEMBERS = [['Antonio', 'Toro Loco'], ['Biagio', 'Biageo'], ['Carlos', 'Carlitos'], ['Donato', 'The Boss'], ['Francesco', 'Frankie'], ['Marcos', 'Tronco'], ['Massimo', 'Jack Hammer'], ['Pietro', 'Uncle Peter'], ['Rinaldo', 'Rino'], ['Salvatore', 'Kraken'], ['Saskia', 'Alaaf Kia'], ['Simone', 'Don Simon'], ['Tessa', 'Tres Tess']];
  // "Choose your liquid": the state of water each member feels closest to.
  const LIQUIDS = {
    lake: { ic: '🏞️', n: 'Mountain lake', d: 'Calm and clear. The quiet strength of the crew.' },
    river: { ic: '🏞', n: 'River', d: 'Always on the move, always finding a way.' },
    wave: { ic: '🌊', n: 'Wave', d: 'Playful energy that comes and goes.' },
    tsunami: { ic: '🌪️', n: 'Tsunami', d: 'Stormy and powerful. Unstoppable when it starts.' }
  };

  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const enc = encodeURIComponent;

  /* ---- identity (Cloudflare Access) ---- */
  let idP = null;
  function identity() {
    if (!idP) idP = fetch('/cdn-cgi/access/get-identity', { credentials: 'same-origin' })
      .then(r => r.ok ? r.json() : {}).then(j => (j && j.email ? String(j.email).toLowerCase() : null)).catch(() => null);
    return idP;
  }

  /* ---- signed database token ----
     /api/token is a Cloudflare Worker that checks the Access login and returns a short-lived
     Supabase token carrying the member's email, so the database knows who is writing.
     Until the Worker is deployed the call fails and requests keep using the public key. */
  let tok = null, tokExp = 0, tokP = null;
  function loadToken() {
    tokP = new Promise(function (done) {
      const t = setTimeout(() => done(null), 4000);
      _fetch('/api/token', { credentials: 'same-origin', cache: 'no-store' })
        .then(r => r.ok && /json/.test(r.headers.get('content-type') || '') ? r.json() : null)
        .then(j => {
          clearTimeout(t);
          if (j && j.token) { tok = j.token; tokExp = (j.exp || 0) * 1000; setTimeout(loadToken, Math.max(60000, tokExp - Date.now() - 300000)); }
          done(tok);
        }).catch(() => { clearTimeout(t); done(null); });
    });
    return tokP;
  }
  const _fetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    const url = typeof input === 'string' ? input : (input && input.url) || '';
    if (url.indexOf(BASE) !== 0) return _fetch(input, init);
    const p = tok && Date.now() < tokExp - 30000 ? Promise.resolve(tok) : (tokP || loadToken());
    return p.then(function (t) {
      if (!t) return _fetch(input, init);
      const o = Object.assign({}, init || {});
      const h = new Headers(o.headers || (input instanceof Request ? input.headers : undefined));
      h.set('Authorization', 'Bearer ' + t);
      if (!h.get('apikey')) h.set('apikey', ANON);
      o.headers = h;
      return _fetch(input, o);
    });
  };
  loadToken();

  /* ---- database helpers ---- */
  const R = BASE + '/rest/v1/';
  const H = { apikey: ANON, Authorization: 'Bearer ' + ANON };
  const HJ = Object.assign({ 'Content-Type': 'application/json' }, H);
  async function get(q) { try { const r = await fetch(R + q, { headers: H }); return r.ok ? await r.json() : null; } catch (e) { return null; } }
  async function send(method, q, body, prefer) {
    const r = await fetch(R + q, { method: method, headers: Object.assign({ Prefer: prefer || 'return=minimal' }, HJ), body: body === undefined ? undefined : JSON.stringify(body) });
    if (!r.ok) throw new Error(await r.text().catch(() => String(r.status)));
    return /representation/.test(prefer || '') ? r.json() : null;
  }
  const api = {
    get: get,
    insert: (t, rows, prefer) => send('POST', t, rows, prefer),
    upsert: (t, rows, conflict) => send('POST', t + '?on_conflict=' + conflict, rows, 'resolution=merge-duplicates,return=minimal'),
    update: (q, patch) => send('PATCH', q, patch),
    remove: q => send('DELETE', q),
    rpc: (fn, args) => fetch(R + 'rpc/' + fn, { method: 'POST', headers: HJ, body: JSON.stringify(args || {}) }).then(r => r.ok ? r.json() : null).catch(() => null)
  };

  let nickP = null;
  function nicks(force) {
    if (!nickP || force) nickP = get('nicknames?select=email,nickname').then(r => r || []);
    return nickP;
  }

  function shrink(file, max) {
    return new Promise(function (ok, fail) {
      const img = new Image();
      img.onload = function () {
        const k = Math.min(1, (max || 1280) / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        c.toBlob(b => b ? ok(b) : fail(), 'image/jpeg', 0.82);
      };
      img.onerror = fail; img.src = URL.createObjectURL(file);
    });
  }
  async function upload(blob, folder) {
    const path = (folder || 'misc') + '/' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.jpg';
    const r = await fetch(BASE + '/storage/v1/object/blog-images/' + path, { method: 'POST', headers: Object.assign({ 'Content-Type': 'image/jpeg' }, H), body: blob });
    if (!r.ok) throw new Error('upload');
    return BASE + '/storage/v1/object/public/blog-images/' + path;
  }

  // Great-circle distance in km.
  function km(a, b) {
    const r = Math.PI / 180, dLat = (b[0] - a[0]) * r, dLng = (b[1] - a[1]) * r;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLng / 2) ** 2;
    return 2 * 6371 * Math.asin(Math.sqrt(h));
  }

  /* ---- tiny event bus between page modules ---- */
  const bus = document.createElement('i');
  const on = (n, f) => bus.addEventListener(n, e => f(e.detail));
  const emit = (n, d) => bus.dispatchEvent(new CustomEvent(n, { detail: d }));
  const last = {};
  function set(n, d) { last[n] = d; emit(n, d); }
  function when(n, f) { if (n in last) f(last[n]); on(n, f); }

  window.TT = { BASE, ANON, H, HJ, R, MEETINGS, MEMBERS, LIQUIDS, esc, enc, identity, api, nicks, shrink, upload, km, on, emit, set, when, token: () => tokP };
})();
