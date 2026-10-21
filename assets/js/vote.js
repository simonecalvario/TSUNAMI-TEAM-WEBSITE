    (function () {
      const SB = 'https://dykofnyhwusghfowfxbi.supabase.co/rest/v1/meeting_votes';
      const KEY = 'sb_publishable_BDU9_W78RXyMw0GGQlVBkg_GepwIoDr';
      const H = { apikey: KEY, 'Content-Type': 'application/json' };
      const map = window.ttMap;
      if (!map) return;
      const $ = id => document.getElementById(id);
      const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
      const layer = L.layerGroup().addTo(map);
      let email = null, votes = [], pending = null, pendMarker = null, found = [], nm = {};
      const nameOf = e => nm[e] || 'a member';
      (async function () { try { const r = await fetch(SB.replace('meeting_votes', 'nicknames') + '?select=email,nickname', { headers: H }); if (r.ok) (await r.json()).forEach(x => { nm[x.email] = x.nickname; }); } catch (e) {} render(); })();

      fetch('/cdn-cgi/access/get-identity', { credentials: 'same-origin' })
        .then(r => r.ok ? r.json() : {})
        .then(j => { if (j && j.email) email = j.email.toLowerCase(); render(); })
        .catch(function () {});

      async function load() {
        try {
          const r = await fetch(SB + '?select=email,city,country,lat,lng', { headers: H });
          votes = r.ok ? await r.json() : [];
        } catch (e) { votes = []; }
        render();
      }

      function render() {
        layer.clearLayers();
        const g = {};
        votes.forEach(v => {
          const k = (v.city + '|' + (v.country || '')).toLowerCase();
          const c = g[k] || (g[k] = { city: v.city, country: v.country, lat: v.lat, lng: v.lng, n: 0, mine: false, who: [] });
          c.n++; c.who.push(nameOf(v.email));
          if (v.email === email) c.mine = true;
        });
        const arr = Object.values(g).sort((a, b) => b.n - a.n);
        arr.forEach(c => {
          const icon = L.divIcon({ className: '', html: '<div class="vpin' + (c.mine ? ' mine' : '') + '">' + c.n + '</div>', iconSize: [34, 34], iconAnchor: [17, 17] });
          L.marker([c.lat, c.lng], { icon: icon })
            .bindPopup('<strong>' + esc(c.city) + '</strong><br>' + c.n + (c.n > 1 ? ' votes' : ' vote') + '<br><small>' + esc(c.who.join(', ')) + '</small>')
            .addTo(layer);
        });
        $('vote-rank').innerHTML = arr.length
          ? arr.map(c => '<li><span>' + esc(c.city) + (c.country ? ', ' + esc(c.country) : '') + '</span><b>' + c.n + '</b><small class="who">🗳 ' + esc(c.who.join(', ')) + '</small></li>').join('')
          : '<li>No votes yet. Be the first!</li>';
        const m = votes.find(v => v.email === email);
        $('vote-mine').innerHTML = m
          ? 'Your vote: <strong>' + esc(m.city) + '</strong>. You can change it anytime. <button id="vote-del" class="vote-del">Remove my vote</button>'
          : 'You have not voted yet.';
        if (m) $('vote-del').onclick = removeVote;
      }

      async function removeVote() {
        if (!email) return;
        try {
          const r = await fetch(SB + '?email=eq.' + encodeURIComponent(email), { method: 'DELETE', headers: H });
          if (!r.ok) throw new Error('fail');
          $('vote-pending').innerHTML = '<p>Your vote has been removed.</p>';
          load();
        } catch (e) {
          $('vote-pending').innerHTML = '<p>Sorry, the vote could not be removed. Please try again.</p>';
        }
      }

      function choose(p) {
        pending = p;
        if (pendMarker) map.removeLayer(pendMarker);
        pendMarker = L.marker([p.lat, p.lng]).addTo(map);
        map.setView([p.lat, p.lng], Math.max(map.getZoom(), 5));
        $('vote-pending').innerHTML = '<p>Selected: <strong>' + esc(p.city) + (p.country ? ', ' + esc(p.country) : '') + '</strong></p><button class="button" id="vote-go">Confirm my vote</button>';
        $('vote-go').onclick = vote;
      }

      async function vote() {
        if (!pending) return;
        if (!email) {
          try { email = localStorage.getItem('tt_email') || ''; } catch (e) {}
          if (!email) email = (window.prompt('Your email:') || '').trim().toLowerCase();
          if (!email) return;
          try { localStorage.setItem('tt_email', email); } catch (e) {}
        }
        const row = { email: email, city: pending.city, country: pending.country || null, lat: pending.lat, lng: pending.lng, updated_at: new Date().toISOString() };
        try {
          const r = await fetch(SB + '?on_conflict=email', {
            method: 'POST',
            headers: Object.assign({ Prefer: 'resolution=merge-duplicates,return=minimal' }, H),
            body: JSON.stringify([row])
          });
          if (!r.ok) throw new Error('fail');
          if (pendMarker) { map.removeLayer(pendMarker); pendMarker = null; }
          pending = null;
          $('vote-pending').innerHTML = '<p>Vote saved. Thank you!</p>';
          load();
        } catch (e) {
          $('vote-pending').innerHTML = '<p>Sorry, the vote could not be saved. Please try again.</p>';
        }
      }

      function place(a, fallback) {
        return a.city || a.town || a.village || a.municipality || a.county || a.state || fallback;
      }

      let timer;
      $('vote-q').addEventListener('input', function (e) {
        clearTimeout(timer);
        const q = e.target.value.trim();
        if (q.length < 3) { $('vote-results').innerHTML = ''; return; }
        timer = setTimeout(async function () {
          try {
            const r = await fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&accept-language=en&q=' + encodeURIComponent(q));
            const j = await r.json();
            found = j.map(x => ({ city: place(x.address || {}, x.name), country: (x.address || {}).country, lat: parseFloat(x.lat), lng: parseFloat(x.lon) })).filter(p => p.city);
            $('vote-results').innerHTML = found.map((p, i) => '<li data-i="' + i + '">' + esc(p.city) + (p.country ? ', ' + esc(p.country) : '') + '</li>').join('') || '<li>No results</li>';
          } catch (err) { $('vote-results').innerHTML = '<li>Search unavailable, try clicking the map.</li>'; }
        }, 450);
      });

      $('vote-results').addEventListener('click', function (e) {
        const li = e.target.closest('li[data-i]');
        if (!li) return;
        choose(found[+li.dataset.i]);
        $('vote-results').innerHTML = '';
        $('vote-q').value = '';
      });

      function subtab(name) {
        const b = Array.from(document.querySelectorAll('#meetings .subtabs button')).find(x => x.textContent.indexOf(name) > -1);
        if (b) b.click();
      }
      $('vote-onmap').addEventListener('click', function () {
        $('map-pick').classList.remove('mp-off');
        subtab('Map');
        setTimeout(function () { try { $('map-pick').scrollIntoView({ block: 'start', behavior: 'smooth' }); } catch (x) {} map.invalidateSize(); }, 120);
      });
      map.on('click', async function (e) {
        const picking = !$('map-pick').classList.contains('mp-off') || document.querySelector('#meetings .subtabs');
        try {
          const r = await fetch('https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=10&accept-language=en&lat=' + e.latlng.lat + '&lon=' + e.latlng.lng);
          const j = await r.json();
          const a = j.address || {};
          const city = place(a, null);
          if (!city) { $('vote-pending').innerHTML = '<p>Please click on a city or a land area.</p>'; return; }
          choose({ city: city, country: a.country, lat: e.latlng.lat, lng: e.latlng.lng });
          $('map-pick').classList.add('mp-off');
          if (picking) { subtab('Vote'); setTimeout(function () { try { $('vote-pending').scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (x) {} }, 150); }
        } catch (err) {
          $('vote-pending').innerHTML = '<p>Could not read that place, try the search bar.</p>';
        }
      });

      load();
    })();
