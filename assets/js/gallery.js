    (function () {
      const M = window.ttMeeting;
      if (!M) return;
      const KEY_M = M.key;
      const BASE = 'https://dykofnyhwusghfowfxbi.supabase.co';
      const JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5a29mbnlod3VzZ2hmb3dmeGJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwNjUwOTQsImV4cCI6MjEwNzY0MTA5NH0.wLS75UXlm2evHg1mlvjvrlJASDP9KRaE_b8fhnJ8htI';
      const H = { apikey: JWT, Authorization: 'Bearer ' + JWT };
      const HJ = Object.assign({ 'Content-Type': 'application/json' }, H);
      const T = BASE + '/rest/v1/meeting_photos', TR = BASE + '/rest/v1/photo_reactions', TC = BASE + '/rest/v1/photo_comments';
      const EM = ['👍', '❤️', '😂', '😮', '😢', '😡'];
      const $ = id => document.getElementById(id);
      const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
      const enc = encodeURIComponent;
      let email = null, photos = [], nicks = {}, rx = [], cm = [], rxOK = true, cmOK = true, openId = null;

      fetch('/cdn-cgi/access/get-identity', { credentials: 'same-origin' })
        .then(r => r.ok ? r.json() : {})
        .then(j => { if (j && j.email) email = j.email.toLowerCase(); refresh(); })
        .catch(function () {});

      function shrink(file) {
        return new Promise(function (ok, fail) {
          const img = new Image();
          img.onload = function () {
            const k = Math.min(1, 1600 / Math.max(img.width, img.height));
            const c = document.createElement('canvas');
            c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
            c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
            c.toBlob(b => b ? ok(b) : fail(), 'image/jpeg', 0.82);
          };
          img.onerror = fail; img.src = URL.createObjectURL(file);
        });
      }

      async function load() {
        try {
          const r = await fetch(T + '?select=*&meeting=eq.' + KEY_M + '&order=created_at.desc', { headers: H });
          if (!r.ok) throw 0;
          photos = await r.json();
          try { const n = await fetch(BASE + '/rest/v1/nicknames?select=email,nickname', { headers: H }); if (n.ok) (await n.json()).forEach(x => { nicks[x.email] = x.nickname; }); } catch (e) {}
        } catch (e) { photos = null; }
        await loadSocial();
        refresh();
      }
      async function loadSocial() {
        try { const r = await fetch(TR + '?select=target,email,emoji&limit=20000', { headers: H }); if (r.ok) { rx = await r.json(); rxOK = true; } else { rxOK = false; rx = []; } } catch (e) { rxOK = false; }
        try { const r = await fetch(TC + '?select=*&order=created_at.asc&limit=5000', { headers: H }); if (r.ok) { cm = await r.json(); cmOK = true; } else { cmOK = false; cm = []; } } catch (e) { cmOK = false; }
      }
      const nameOf = e => nicks[e] || 'a member';
      function ago(t) {
        const s = Math.max(1, Math.round((Date.now() - new Date(t).getTime()) / 1000));
        if (s < 60) return 'now'; if (s < 3600) return Math.round(s / 60) + ' min'; if (s < 86400) return Math.round(s / 3600) + ' h';
        return new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      }
      function rxInfo(t) {
        const c = {}; let mine = null, n = 0;
        rx.forEach(r => { if (r.target === t) { c[r.emoji] = (c[r.emoji] || 0) + 1; n++; if (r.email === email) mine = r.emoji; } });
        const top = Object.keys(c).sort((a, b) => c[b] - c[a]).slice(0, 3);
        return { c: c, n: n, mine: mine, top: top };
      }
      function rxLine(t, extra) {
        if (!rxOK) return extra ? '<div class="rxs">' + extra + '</div>' : '';
        const i = rxInfo(t);
        return '<div class="rxs" data-t="' + t + '">' + (i.n ? '<span class="sum" data-open="1">' + i.top.join('') + ' ' + i.n + '</span>' : '') + (extra || '') +
          '<button type="button" class="rxb' + (i.mine ? ' on' : '') + '" data-pick="' + t + '">' + (i.mine || '☺') + ' ' + (i.mine ? 'Reacted' : 'React') + '</button></div>';
      }
      const ncm = id => cm.filter(c => String(c.photo_id) === String(id)).length;

      function renderGrid() {
        const g = $('grid');
        if (photos === null) { g.innerHTML = '<p class="empty">The gallery could not be loaded right now. Reload the page to retry.</p>'; return; }
        g.innerHTML = photos.length ? photos.map(p => {
          const n = ncm(p.id), t = 'p' + p.id;
          return '<div class="cell" data-ph="' + esc(p.id) + '"><img src="' + esc(p.image_url) + '" alt="Photo" loading="lazy">' + (p.email === email ? '<button data-del="' + esc(p.id) + '" title="Delete">✕</button>' : '') +
            '<div class="by">by <b>' + esc(nameOf(p.email)) + '</b></div>' +
            rxLine(t, cmOK ? '<span class="sum" data-open="1">💬 ' + n + '</span>' : '') + '</div>';
        }).join('') : '<p class="empty">No photos yet. Be the first to add one!</p>';
      }
      function renderLb() {
        if (openId == null) return;
        const p = (photos || []).find(x => String(x.id) === String(openId)); if (!p) return;
        $('lbimg').src = p.image_url;
        const i = rxInfo('p' + p.id);
        $('lbbar').innerHTML = rxOK ? EM.map(e => '<button type="button" data-em="' + e + '" class="' + (i.mine === e ? 'on' : '') + '"><span>' + e + '</span>' + (i.c[e] || 0) + '</button>').join('') : '';
        const list = cm.filter(c => String(c.photo_id) === String(p.id));
        $('lbcm').innerHTML = cmOK ? (list.length ? list.map(c => '<div class="cmt">' + (c.email === email ? '<button class="del" data-delc="' + c.id + '" title="Delete">✕</button>' : '') +
          '<small><b>' + esc(nameOf(c.email)) + '</b> · ' + ago(c.created_at) + '</small><p>' + esc(c.body) + '</p>' + rxLine('c' + c.id) + '</div>').join('') : '<div class="lbn">No comments yet. Say something!</div>') : '<div class="lbn">Comments are not available yet.</div>';
        $('lbf').style.display = cmOK ? 'flex' : 'none';
      }
      function refresh() { renderGrid(); renderLb(); }

      async function react(target, emoji) {
        if (!email) return;
        const mine = rx.find(r => r.target === target && r.email === email);
        try {
          if (mine && mine.emoji === emoji) {
            rx = rx.filter(r => r !== mine); refresh();
            await fetch(TR + '?target=eq.' + enc(target) + '&email=eq.' + enc(email), { method: 'DELETE', headers: H });
          } else {
            if (mine) mine.emoji = emoji; else rx.push({ target: target, email: email, emoji: emoji });
            refresh();
            await fetch(TR + '?on_conflict=target,email', { method: 'POST', headers: Object.assign({ Prefer: 'resolution=merge-duplicates,return=minimal' }, HJ), body: JSON.stringify({ target: target, email: email, emoji: emoji }) });
          }
        } catch (e) {}
      }

      /* emoji picker */
      const pk = document.createElement('div'); pk.id = 'pk'; pk.innerHTML = EM.map(e => '<button type="button" data-em="' + e + '">' + e + '</button>').join(''); document.body.appendChild(pk);
      let pkT = null;
      function openPicker(btn, target) {
        pkT = target; pk.classList.add('open');
        const r = btn.getBoundingClientRect(), w = pk.offsetWidth;
        pk.style.left = Math.max(6, Math.min(innerWidth - w - 6, r.left + r.width / 2 - w / 2)) + 'px';
        pk.style.top = Math.max(6, r.top - pk.offsetHeight - 8) + 'px';
      }
      pk.addEventListener('click', function (e) { const b = e.target.closest('[data-em]'); if (!b) return; e.stopPropagation(); pk.classList.remove('open'); if (pkT) react(pkT, b.dataset.em); });
      document.addEventListener('click', function (e) { if (!pk.classList.contains('open')) return; if (e.target.closest('#pk') || e.target.closest('[data-pick]')) return; pk.classList.remove('open'); });

      function openLb(id) { openId = id; $('lb').classList.add('open'); document.body.style.overflow = 'hidden'; $('lb').scrollTop = 0; renderLb(); }
      function closeLb() { openId = null; $('lb').classList.remove('open'); document.body.style.overflow = ''; pk.classList.remove('open'); }

      $('grid').addEventListener('click', async function (e) {
        const pb = e.target.closest('[data-pick]'); if (pb) { e.stopPropagation(); openPicker(pb, pb.dataset.pick); return; }
        const del = e.target.closest('[data-del]');
        if (del) {
          const id = del.dataset.del;
          if (confirm('Delete this photo?')) {
            await fetch(T + '?id=eq.' + enc(id) + '&email=eq.' + enc(email), { method: 'DELETE', headers: H });
            try { await fetch(TC + '?photo_id=eq.' + enc(id), { method: 'DELETE', headers: H }); await fetch(TR + '?target=eq.' + enc('p' + id), { method: 'DELETE', headers: H }); } catch (x) {}
            load();
          }
          return;
        }
        const cell = e.target.closest('.cell'); if (!cell) return;
        if (e.target.tagName === 'IMG' || e.target.closest('[data-open]')) openLb(cell.dataset.ph);
      });
      $('lb').addEventListener('click', async function (e) {
        if (e.target === this || e.target.closest('.lbx')) { closeLb(); return; }
        const em = e.target.closest('#lbbar [data-em]'); if (em) { react('p' + openId, em.dataset.em); return; }
        const pb = e.target.closest('[data-pick]'); if (pb) { e.stopPropagation(); openPicker(pb, pb.dataset.pick); return; }
        const dc = e.target.closest('[data-delc]');
        if (dc && confirm('Delete this comment?')) {
          const id = dc.dataset.delc;
          cm = cm.filter(c => String(c.id) !== String(id)); refresh();
          try { await fetch(TC + '?id=eq.' + enc(id) + '&email=eq.' + enc(email), { method: 'DELETE', headers: H }); await fetch(TR + '?target=eq.' + enc('c' + id), { method: 'DELETE', headers: H }); } catch (x) {}
        }
      });
      $('lbf').addEventListener('submit', async function (e) {
        e.preventDefault();
        const inp = $('lbi'), body = inp.value.trim();
        if (!body || !email || openId == null) return;
        inp.disabled = true;
        try {
          const r = await fetch(TC, { method: 'POST', headers: Object.assign({ Prefer: 'return=representation' }, HJ), body: JSON.stringify({ photo_id: String(openId), email: email, body: body.slice(0, 500) }) });
          if (!r.ok) throw 0;
          const row = (await r.json())[0]; if (row) cm.push(row);
          inp.value = ''; refresh();
          const l = $('lbcm'); l.lastElementChild && l.lastElementChild.scrollIntoView({ block: 'nearest' });
        } catch (x) { alert('Sorry, the comment could not be saved. Please try again.'); }
        inp.disabled = false;
      });

      $('go').onclick = async function () {
        const files = Array.from($('f').files), msg = $('msg');
        if (!files.length) { msg.textContent = 'Choose at least one photo.'; return; }
        if (!email) { msg.textContent = 'Could not identify your account. Reload the page.'; return; }
        $('go').disabled = true;
        try {
          for (let i = 0; i < files.length; i++) {
            msg.textContent = 'Uploading ' + (i + 1) + '/' + files.length + '…';
            const blob = await shrink(files[i]);
            const path = 'album-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.jpg';
            const up = await fetch(BASE + '/storage/v1/object/blog-images/' + path, { method: 'POST', headers: Object.assign({ 'Content-Type': 'image/jpeg' }, H), body: blob });
            if (!up.ok) throw 0;
            const r = await fetch(T, { method: 'POST', headers: Object.assign({ Prefer: 'return=minimal' }, HJ), body: JSON.stringify({ email: email, meeting: KEY_M, image_url: BASE + '/storage/v1/object/public/blog-images/' + path }) });
            if (!r.ok) throw 0;
          }
          $('f').value = ''; msg.textContent = 'Done!'; load();
          if (window.ttGalleryExtras) window.ttGalleryExtras();
        } catch (err) { msg.textContent = 'Sorry, upload failed. Please try again.'; }
        $('go').disabled = false;
      };
      load();
    })();
  
