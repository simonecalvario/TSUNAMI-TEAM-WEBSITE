/* Tsunami Meeting vote: Leaflet + Supabase.
   Loaded right after leaflet.js and before the map script in index.html. */
(function () {
  var SUPABASE_URL = 'https://dykofnyhwusghfowfxbi.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_BDU9_W78RXyMw0GGQlVBkg_GepwIoDr';
  var PAST = ['barcelona', 'doha', 'munich', 'münchen'];

  // Grab the map the page creates (the page keeps it private otherwise).
  L.Map.addInitHook(function () { window.tsunamiMap = this; });

  window.addEventListener('load', function () {
    var map = window.tsunamiMap;
    var host = document.querySelector('#meetings .container');
    var anchor = document.getElementById('world-map');
    if (!map || !host || !anchor || !window.supabase) return;

    var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    var user = null, mine = null, layer = L.layerGroup().addTo(map), timer;

    var css = document.createElement('style');
    css.textContent =
      '#vote-panel{margin-top:22px;background:var(--dark);border:1px solid var(--line);border-radius:8px;padding:22px}' +
      '#vote-panel h3{color:var(--yellow);margin-bottom:6px}#vote-panel h4{margin:18px 0 6px}' +
      '.vp-hint{color:var(--grey);font-size:.95rem;margin-bottom:14px}' +
      '.vp-row{display:flex;gap:8px;flex-wrap:wrap}' +
      '#vote-panel input{flex:1;min-width:200px;width:100%;padding:12px;border-radius:6px;border:1px solid var(--line);background:#07142a;color:#fff;font-size:1rem}' +
      '#vote-panel button,.vp-btn{padding:11px 16px;border:0;border-radius:6px;background:var(--yellow);color:#101010;font-weight:900;cursor:pointer}' +
      '#vote-panel button.vp-link{background:none;color:var(--blue);text-decoration:underline;padding:0}' +
      '.vp-btn{margin-top:8px}.vp-search{position:relative;margin-bottom:10px}' +
      '#vp-res{list-style:none;position:absolute;left:0;right:0;z-index:1000;background:#0b1730;border:1px solid var(--line);border-radius:6px}' +
      '#vp-res:empty{display:none}#vp-res li{padding:11px 12px;cursor:pointer}#vp-res li:hover{background:rgba(255,255,255,.08)}' +
      '#vp-msg{min-height:1.4em;margin-top:10px;color:var(--yellow)}#vp-msg.err{color:#ff9a9a}' +
      '#vp-top{padding-left:22px;color:var(--grey)}' +
      '.vt-pin{border-radius:50%;background:var(--orange);color:#fff;font-weight:700;text-align:center;border:2px solid #fff;box-sizing:border-box}' +
      '.vt-pin.own{border-color:var(--yellow);box-shadow:0 0 0 3px var(--yellow)}';
    document.head.appendChild(css);

    var panel = document.createElement('div');
    panel.id = 'vote-panel';
    panel.innerHTML =
      '<h3>Vote the next Tsunami Meeting</h3>' +
      '<p class="vp-hint">Search a city or tap anywhere on the map. One vote each, you can change it any time.</p>' +
      '<div id="vp-auth"></div>' +
      '<div id="vp-vote" hidden><div class="vp-search"><input id="vp-q" placeholder="Search a city..." autocomplete="off"><ul id="vp-res"></ul></div><p id="vp-mine"></p></div>' +
      '<p id="vp-msg" aria-live="polite"></p><h4>Top destinations</h4><ol id="vp-top"></ol>';
    anchor.after(panel);

    function $(id) { return document.getElementById(id); }
    function esc(s) {
      return String(s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    }
    function msg(t, err) { var m = $('vp-msg'); m.textContent = t || ''; m.className = err ? 'err' : ''; }

    function renderAuth() {
      var a = $('vp-auth');
      if (user) {
        a.innerHTML = '<span>Logged in as <b>' + esc(user.email) + '</b></span> <button class="vp-link" id="vp-out">Log out</button>';
        $('vp-out').onclick = function () { sb.auth.signOut(); };
        $('vp-vote').hidden = false;
      } else {
        a.innerHTML = '<div class="vp-row"><input id="vp-mail" type="email" placeholder="Your email to vote" autocomplete="email"><button id="vp-send">Send login link</button></div>';
        $('vp-send').onclick = sendLink;
        $('vp-vote').hidden = true;
      }
    }

    async function sendLink() {
      var email = $('vp-mail').value.trim();
      if (!/^\S+@\S+\.\S+$/.test(email)) return msg('Enter a valid email.', true);
      try { localStorage.setItem('vp_pending', '1'); } catch (e) {}
      var r = await sb.auth.signInWithOtp({ email: email, options: { emailRedirectTo: location.origin + '/' } });
      msg(r.error ? r.error.message : 'Check your email and open the link in this same browser.', !!r.error);
    }

    function propose(p) {
      if (PAST.indexOf(p.city.toLowerCase()) > -1) return msg(p.city + ' already hosted a Tsunami Meeting.', true);
      msg('');
      map.setView([p.lat, p.lng], Math.max(map.getZoom(), 5));
      var box = document.createElement('div');
      box.style.textAlign = 'center';
      var b = document.createElement('strong');
      b.textContent = p.city + (p.country ? ', ' + p.country : '');
      var btn = document.createElement('button');
      btn.className = 'vp-btn';
      btn.textContent = mine ? 'Change my vote to this city' : 'Vote for this city';
      btn.onclick = function () { map.closePopup(); save(p); };
      box.appendChild(b);
      box.appendChild(document.createElement('br'));
      box.appendChild(btn);
      L.popup({ className: 'meetings-popup' }).setLatLng([p.lat, p.lng]).setContent(box).openOn(map);
    }

    async function search(q) {
      try {
        var r = await fetch('https://photon.komoot.io/api/?limit=6&lang=en&osm_tag=place:city&osm_tag=place:town&q=' + encodeURIComponent(q));
        var j = await r.json();
        var ul = $('vp-res');
        ul.innerHTML = '';
        j.features.forEach(function (f) {
          var p = f.properties;
          if (!p.name) return;
          var li = document.createElement('li');
          li.textContent = p.name + (p.country ? ', ' + p.country : '');
          li.onclick = function () {
            ul.innerHTML = '';
            $('vp-q').value = '';
            propose({ city: p.name, country: p.country || '', lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0] });
          };
          ul.appendChild(li);
        });
        if (!ul.children.length) ul.innerHTML = '<li>No city found</li>';
      } catch (e) { msg('Search unavailable, try tapping the map.', true); }
    }

    map.on('click', async function (e) {
      if (!user) return msg('Log in with your email to vote.', true);
      msg('Finding the city...');
      try {
        var ll = e.latlng.wrap();
        var r = await fetch('https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=10&accept-language=en&lat=' + ll.lat + '&lon=' + ll.lng);
        var j = await r.json(), a = j.address || {};
        var city = a.city || a.town || a.village || a.municipality || a.county || a.state;
        if (!city) return msg('No city here, try another spot.', true);
        propose({ city: city, country: a.country || '', lat: +j.lat, lng: +j.lon });
      } catch (err) { msg('Could not find that place, try again.', true); }
    });

    async function save(p) {
      var r = await sb.from('votes').upsert({
        user_id: user.id, city: p.city, country: p.country, lat: p.lat, lng: p.lng, updated_at: new Date().toISOString()
      });
      if (r.error) return msg(r.error.message, true);
      msg('Vote saved: ' + p.city + '.');
      load();
    }

    async function removeVote() {
      var r = await sb.from('votes').delete().eq('user_id', user.id);
      msg(r.error ? r.error.message : 'Vote removed.', !!r.error);
      load();
    }

    async function load() {
      var t = await sb.from('vote_totals').select('*').order('votes', { ascending: false });
      mine = null;
      if (user) { var m = await sb.from('votes').select('city,country').maybeSingle(); mine = m.data || null; }
      var rows = t.data || [];
      layer.clearLayers();
      rows.forEach(function (r) {
        var own = mine && mine.city === r.city && mine.country === r.country;
        var s = 24 + Math.min(r.votes, 10) * 3;
        var icon = L.divIcon({
          className: '', iconSize: [s, s],
          html: '<div class="vt-pin' + (own ? ' own' : '') + '" style="width:' + s + 'px;height:' + s + 'px;line-height:' + (s - 4) + 'px">' + r.votes + '</div>'
        });
        L.marker([r.lat, r.lng], { icon: icon })
          .bindTooltip(esc(r.city) + ' · ' + r.votes + (r.votes == 1 ? ' vote' : ' votes'))
          .addTo(layer);
      });
      $('vp-top').innerHTML = rows.slice(0, 5).map(function (r) {
        return '<li>' + esc(r.city) + (r.country ? ', ' + esc(r.country) : '') + ' <b>' + r.votes + '</b></li>';
      }).join('') || '<li>No votes yet</li>';
      $('vp-mine').innerHTML = mine
        ? 'Your vote: <b>' + esc(mine.city) + '</b> <button class="vp-link" id="vp-del">Remove</button>'
        : "You haven't voted yet.";
      if (mine) $('vp-del').onclick = removeVote;
    }

    $('vp-q').addEventListener('input', function (e) {
      clearTimeout(timer);
      var q = e.target.value.trim();
      if (q.length < 2) { $('vp-res').innerHTML = ''; return; }
      timer = setTimeout(function () { search(q); }, 350);
    });

    sb.auth.onAuthStateChange(function (event, session) {
      user = session ? session.user : null;
      renderAuth();
      setTimeout(load, 0);
      if (event === 'SIGNED_IN') {
        var pending = false;
        try { pending = localStorage.getItem('vp_pending'); localStorage.removeItem('vp_pending'); } catch (e) {}
        if (pending) setTimeout(function () { $('meetings').scrollIntoView(); }, 700);
      }
    });
  });
})();
