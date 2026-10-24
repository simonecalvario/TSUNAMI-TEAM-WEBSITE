/* The precise place of a photo (gallery and Blog): "📍 Place" with a link to the map,
   and for whoever posted the photo a search to add or change it (any place: a bar, a beach, a street…).
   Modules register a prefix ("ph", "post") with save(id, place|null) and rerender(). */
(function () {
  const esc = TT.esc, enc = TT.enc, H = {};
  let found = [], t = null;
  const P = TT.place = {
    editing: null,
    register: function (prefix, h) { H[prefix] = h; },
    html: function (key, row, can) {
      if (P.editing === key) {
        return '<div class="pl-ed" data-pl="' + key + '"><input class="pl-q" type="search" placeholder="Search the place: a bar, a beach, a street…" autocomplete="off">' +
          '<ul class="pl-res"></ul><div class="pl-b">' + (row.place ? '<button type="button" data-pl-del="' + key + '">Remove the place</button>' : '') + '<button type="button" data-pl-x="' + key + '">Cancel</button></div></div>';
      }
      if (row.place) {
        const map = row.place_lat != null ? 'https://www.google.com/maps/search/?api=1&query=' + row.place_lat + ',' + row.place_lng : 'https://www.google.com/maps/search/?api=1&query=' + enc(row.place);
        return '<div class="pl-row">📍 <a href="' + map + '" target="_blank" rel="noopener">' + esc(row.place) + '</a>' + (can ? '<button type="button" class="pl-edit" data-pl-edit="' + key + '" aria-label="Change the place">✏️</button>' : '') + '</div>';
      }
      return can ? '<div class="pl-row"><button type="button" class="pl-add" data-pl-edit="' + key + '">📍 Add the place</button></div>' : '';
    }
  };
  const split = key => { const i = key.indexOf(':'); return [key.slice(0, i), key.slice(i + 1)]; };
  function redraw(key) { const h = H[split(key)[0]]; if (h) h.rerender(); }

  document.addEventListener('click', async function (e) {
    const T = e.target.closest ? e.target : null; if (!T) return;
    const ed = T.closest('[data-pl-edit]');
    if (ed) {
      e.preventDefault(); e.stopPropagation(); P.editing = ed.dataset.plEdit; redraw(P.editing);
      setTimeout(function () { const q = document.querySelector('.pl-ed .pl-q'); if (q) q.focus(); }, 30); return;
    }
    const x = T.closest('[data-pl-x]'); if (x) { e.stopPropagation(); const k = P.editing; P.editing = null; redraw(k); return; }
    const del = T.closest('[data-pl-del]') || null, li = T.closest('.pl-res [data-i]');
    if (!del && !li) return;
    e.stopPropagation();
    const key = P.editing, s = split(key || ''), h = H[s[0]]; if (!h) return;
    const val = li ? found[+li.dataset.i] : null;
    if (li && !val) return;
    P.editing = null;
    try { await h.save(s[1], val ? { place: val.label, place_lat: val.lat, place_lng: val.lng } : { place: null, place_lat: null, place_lng: null }); }
    catch (x2) { alert('The place could not be saved. Please try again.'); }
    h.rerender();
  }, true);

  document.addEventListener('input', function (e) {
    if (!e.target.classList || !e.target.classList.contains('pl-q')) return;
    clearTimeout(t); const q = e.target.value.trim(), ul = e.target.parentNode.querySelector('.pl-res');
    if (q.length < 3) { ul.innerHTML = ''; return; }
    t = setTimeout(async function () {
      try {
        const r = await fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&namedetails=1&limit=6&accept-language=en&q=' + enc(q));
        found = (await r.json()).map(function (x) {
          const a = x.address || {}, town = a.city || a.town || a.village || a.municipality || '', nm = x.name || String(x.display_name || '').split(',')[0];
          const label = [nm, town && town !== nm ? town : '', a.country || ''].filter(Boolean).join(', ');
          return { label: label, lat: +x.lat, lng: +x.lon };
        }).filter(p => p.label);
        ul.innerHTML = found.map((p, i) => '<li data-i="' + i + '">📍 ' + esc(p.label) + '</li>').join('') || '<li>No results</li>';
      } catch (x) { ul.innerHTML = '<li>Search unavailable right now.</li>'; }
    }, 450);
  });
})();
