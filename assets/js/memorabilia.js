    (function () {
      const BASE = 'https://dykofnyhwusghfowfxbi.supabase.co';
      const JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5a29mbnlod3VzZ2hmb3dmeGJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwNjUwOTQsImV4cCI6MjEwNzY0MTA5NH0.wLS75UXlm2evHg1mlvjvrlJASDP9KRaE_b8fhnJ8htI';
      const H = { apikey: JWT, Authorization: 'Bearer ' + JWT };
      const T = BASE + '/rest/v1/memorabilia';
      const $ = id => document.getElementById(id);
      if (!$('mem-grid')) return;
      const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
      const MEET = TT.MEETINGS.map(m => ({ key: m.key, label: m.icon + ' ' + m.name + ' ' + m.year, place: m.name, year: m.year })).concat([
        { key: 'next', label: '🔜 Next meeting' },
        { key: 'other', label: '✨ Other' }
      ]);
      $('mem-meeting').insertAdjacentHTML('afterbegin', TT.MEETINGS.map(m => '<option value="' + m.key + '">' + m.icon + ' ' + esc(m.name) + ' ' + m.year + '</option>').join(''));
      $('mem-meeting').selectedIndex = 0;
      let email = null, items = [], filter = 'all', editing = null;
      const tagOf = m => {
        const k = MEET.find(x => x.key === m.meeting_key);
        if (k && k.key !== 'other') return k.label;
        const y = m.meeting_year || (m.meeting_date ? new Date(m.meeting_date).getFullYear() : '');
        return '📍 ' + esc(m.meeting_place || 'Meeting') + (y ? ' ' + y : '');
      };

      fetch('/cdn-cgi/access/get-identity', { credentials: 'same-origin' })
        .then(r => r.ok ? r.json() : {})
        .then(j => { if (j && j.email) email = j.email.toLowerCase(); render(); })
        .catch(function () {});

      function shrink(file) {
        return new Promise(function (ok, fail) {
          const img = new Image();
          img.onload = function () {
            const k = Math.min(1, 1280 / Math.max(img.width, img.height));
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
          const r = await fetch(T + '?select=*&order=created_at.desc', { headers: H });
          if (!r.ok) throw 0;
          items = await r.json();
        } catch (e) { items = null; }
        render();
      }

      function render() {
        const g = $('mem-grid');
        if (items === null) { g.innerHTML = '<p class="vote-hint">Memorabilia could not be loaded right now. It will retry shortly.</p>'; return; }
        const keyOf = m => (m.meeting_key && MEET.some(x => x.key === m.meeting_key)) ? m.meeting_key : 'other';
        const cnt = k => k === 'all' ? items.length : items.filter(m => keyOf(m) === k).length;
        $('mem-chips').innerHTML = [{ key: 'all', label: 'All' }].concat(MEET).map(x => '<button type="button" class="chip' + (filter === x.key ? ' on' : '') + '" data-f="' + x.key + '">' + x.label + ' (' + cnt(x.key) + ')</button>').join('');
        const list = filter === 'all' ? items : items.filter(m => keyOf(m) === filter);
        if (!list.length) { g.innerHTML = '<p class="vote-hint">Nothing here yet. Be the first to add a piece of our history!</p>'; return; }
        g.innerHTML = list.map(m =>
          '<article class="mem-card"><img src="' + esc(m.image_url) + '" alt="' + esc(m.title) + '" loading="lazy" data-zoom="1"><div class="mem-info">' +
          (editing === m.id
            // The author fixes title and description in place.
            ? '<input class="mem-ed-t" maxlength="120" value="' + esc(m.title) + '" aria-label="Title"><span class="mem-tag">' + tagOf(m) + '</span>' +
              '<textarea class="mem-ed-d" rows="4" maxlength="1000" aria-label="Description">' + esc(m.description) + '</textarea>' +
              '<div class="mem-ed-b"><button type="button" class="button" data-save="' + esc(m.id) + '">Save</button><button type="button" class="vote-del" data-cancel="1">Cancel</button></div>'
            : '<h3>' + esc(m.title) + '</h3><span class="mem-tag">' + tagOf(m) + '</span><p>' + esc(m.description) + '</p>' +
              (m.email === email ? '<div class="mem-ed-b"><button type="button" class="vote-del" data-edit="' + esc(m.id) + '">✏️ Edit</button><button class="vote-del" data-del="' + esc(m.id) + '">Delete</button></div>' : '')) +
          '</div></article>').join('');
      }

      $('mem-chips').addEventListener('click', function (e) { const f = e.target.dataset.f; if (f) { filter = f; render(); } });
      $('mem-meeting').addEventListener('change', function () {
        const o = this.value === 'other';
        $('mem-other').style.display = o ? 'grid' : 'none';
        $('mem-place').required = o; $('mem-year').required = o;
      });

      $('mem-toggle').onclick = function () { $('mem-form').classList.toggle('open'); };

      $('mem-grid').addEventListener('click', async function (e) {
        if (e.target.dataset.zoom) { $('mem-lb').querySelector('img').src = e.target.src; $('mem-lb').classList.add('open'); return; }
        const ed = e.target.dataset.edit;
        if (ed) { editing = ed; render(); const t = $('mem-grid').querySelector('.mem-ed-d'); if (t) t.focus(); return; }
        if (e.target.dataset.cancel) { editing = null; render(); return; }
        const sv = e.target.dataset.save;
        if (sv && email) {
          const card = e.target.closest('.mem-info'), title = card.querySelector('.mem-ed-t').value.trim(), description = card.querySelector('.mem-ed-d').value.trim();
          if (!title) { card.querySelector('.mem-ed-t').focus(); return; }
          e.target.disabled = true;
          const r = await fetch(T + '?id=eq.' + encodeURIComponent(sv) + '&email=eq.' + encodeURIComponent(email), { method: 'PATCH', headers: Object.assign({ 'Content-Type': 'application/json', Prefer: 'return=minimal' }, H), body: JSON.stringify({ title: title, description: description }) }).catch(() => null);
          if (!r || !r.ok) { e.target.disabled = false; alert('Not saved, please try again.'); return; }
          editing = null; load(); return;
        }
        const id = e.target.dataset.del;
        if (id && email && confirm('Delete this piece?')) {
          await fetch(T + '?id=eq.' + encodeURIComponent(id) + '&email=eq.' + encodeURIComponent(email), { method: 'DELETE', headers: H });
          load();
        }
      });
      $('mem-lb').onclick = function () { this.classList.remove('open'); };

      $('mem-form').addEventListener('submit', async function (e) {
        e.preventDefault();
        if (!email) { $('mem-msg').textContent = 'Could not identify your account. Please reload the page.'; return; }
        const btn = $('mem-send'), msg = $('mem-msg');
        btn.disabled = true; msg.textContent = 'Uploading…';
        try {
          const blob = await shrink($('mem-photo').files[0]);
          const path = 'mem-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.jpg';
          const up = await fetch(BASE + '/storage/v1/object/blog-images/' + path, { method: 'POST', headers: Object.assign({ 'Content-Type': 'image/jpeg' }, H), body: blob });
          if (!up.ok) throw 0;
          const r = await fetch(T, { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json', Prefer: 'return=minimal' }, H),
            body: JSON.stringify(Object.assign({ email: email, title: $('mem-title').value.trim(), description: $('mem-desc').value.trim(), image_url: BASE + '/storage/v1/object/public/blog-images/' + path }, (function () {
              const k = $('mem-meeting').value, m = MEET.find(x => x.key === k);
              if (k === 'other') return { meeting_key: 'other', meeting_place: $('mem-place').value.trim(), meeting_year: +$('mem-year').value };
              if (k === 'next') return { meeting_key: 'next', meeting_place: 'Next meeting', meeting_year: null };
              return { meeting_key: k, meeting_place: m.place, meeting_year: m.year };
            })())) });
          if (!r.ok) throw 0;
          $('mem-form').reset(); $('mem-other').style.display = 'none'; $('mem-form').classList.remove('open'); msg.textContent = '';
          load();
        } catch (err) { msg.textContent = 'Sorry, it could not be saved. Please try again.'; }
        btn.disabled = false;
      });

      load();
    })();
