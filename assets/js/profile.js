/* Member profile: the home city, set in the Passport (used by Wrapped for the kilometres). */
(function () {
  const esc = TT.esc, enc = TT.enc;
  let email = null, rows = [];
  const mine = () => rows.find(r => r.email === email) || null;

  async function load() {
    rows = (await TT.api.get('profiles?select=*')) || [];
    TT.set('profiles', rows);
    render();
  }
  async function save(patch) {
    if (!email) return;
    const row = Object.assign({}, mine() || {}, patch, { email: email, updated_at: new Date().toISOString() });
    delete row.created_at;
    await TT.api.upsert('profiles', row, 'email');
    await load();
  }
  TT.profile = { save: save, mine: mine, all: () => rows, reload: load };

  let editing = false, found = [], t = null;
  function render() {
    const box = document.getElementById('pass-city'); if (!box) return;
    const me = mine();
    if (me && me.city && !editing) {
      box.innerHTML = '<span class="pc-now">📍 <b>' + esc(me.city) + '</b>' + (me.country ? ', ' + esc(me.country) : '') + '</span>' +
        '<button type="button" class="vote-del" data-pc="edit" style="margin:0">Change</button><button type="button" class="vote-del" data-pc="clear">Remove</button>';
      return;
    }
    box.innerHTML = '<input type="search" id="pc-q" placeholder="Search your city…" autocomplete="off"><ul class="pc-res" id="pc-res"></ul>';
  }
  document.addEventListener('input', function (e) {
    if (e.target.id !== 'pc-q') return;
    clearTimeout(t); const q = e.target.value.trim(), ul = document.getElementById('pc-res');
    if (q.length < 3) { ul.innerHTML = ''; return; }
    t = setTimeout(async function () {
      try {
        const r = await fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&accept-language=en&featuretype=city&q=' + enc(q));
        found = (await r.json()).map(x => { const a = x.address || {}; return { city: a.city || a.town || a.village || a.municipality || x.name, country: a.country || '', lat: +x.lat, lng: +x.lon }; }).filter(p => p.city);
        ul.innerHTML = found.map((p, i) => '<li data-i="' + i + '">' + esc(p.city) + (p.country ? ', ' + esc(p.country) : '') + '</li>').join('') || '<li>No results</li>';
      } catch (x) { ul.innerHTML = '<li>Search unavailable right now.</li>'; }
    }, 450);
  });
  document.addEventListener('click', function (e) {
    const li = e.target.closest && e.target.closest('#pc-res [data-i]');
    if (li) { const p = found[+li.dataset.i]; editing = false; save({ city: p.city, country: p.country, lat: p.lat, lng: p.lng }); return; }
    const b = e.target.closest && e.target.closest('[data-pc]'); if (!b) return;
    if (b.dataset.pc === 'edit') { editing = true; render(); const q = document.getElementById('pc-q'); if (q) q.focus(); }
    else if (b.dataset.pc === 'clear') save({ city: null, country: null, lat: null, lng: null });
  });
  TT.identity().then(e => { email = e; load(); });
})();
