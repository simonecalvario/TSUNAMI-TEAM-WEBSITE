    (function () {
      const SB = 'https://dykofnyhwusghfowfxbi.supabase.co/rest/v1/meeting_days';
      const KEY = 'sb_publishable_BDU9_W78RXyMw0GGQlVBkg_GepwIoDr';
      const H = { apikey: KEY, 'Content-Type': 'application/json' };
      const $ = id => document.getElementById(id);
      if (!$('cal-grid')) return;
      const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
      const pad = n => (n < 10 ? '0' : '') + n;
      const iso = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const todayIso = iso(today);
      const MAXM = 18;
      let view = new Date(today.getFullYear(), today.getMonth(), 1);
      let email = null, rows = [], saved = new Set(), sel = new Set(), count = {}, voters = {}, nm = {};
      const nameOf = e => nm[e] || 'a member';
      (async function () { try { const r = await fetch(SB.replace('meeting_days', 'nicknames') + '?select=email,nickname', { headers: H }); if (r.ok) (await r.json()).forEach(x => { nm[x.email] = x.nickname; }); } catch (e) {} whoList(); })();
      const MONS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      function rangesOf(set) {
        const days = Array.from(set).sort(), out = [];
        let a = null, b = null;
        const fmt = d => { const x = d.split('-'); return +x[2] + ' ' + MONS[+x[1] - 1]; };
        const next = d => { const t = new Date(d + 'T12:00:00'); t.setDate(t.getDate() + 1); return iso(t); };
        days.forEach(d => { if (a && next(b) === d) { b = d; } else { if (a) out.push(a === b ? fmt(a) : fmt(a) + ' – ' + fmt(b)); a = b = d; } });
        if (a) out.push(a === b ? fmt(a) : fmt(a) + ' – ' + fmt(b));
        return out.join(', ');
      }
      function whoList() {
        const el = $('when-who'); if (!el) return;
        const em = Object.keys(voters);
        el.innerHTML = em.length ? em.map(e => '<div><b>' + esc(nameOf(e)) + (e === email ? ' (you)' : '') + '</b> · ' + esc(rangesOf(voters[e])) + '</div>').join('') : '<div>Nobody has voted yet.</div>';
      }


      fetch('/cdn-cgi/access/get-identity', { credentials: 'same-origin' })
        .then(r => r.ok ? r.json() : {})
        .then(j => { if (j && j.email) { email = j.email.toLowerCase(); } load(); })
        .catch(function () { load(); });

      async function load() {
        try {
          const r = await fetch(SB + '?select=email,day&day=gte.' + todayIso + '&limit=10000', { headers: H });
          if (!r.ok) throw 0;
          rows = await r.json();
          $('when-msg').textContent = '';
        } catch (e) { rows = []; $('when-msg').textContent = 'Calendar not available yet (database table missing).'; }
        count = {}; voters = {}; saved = new Set();
        rows.forEach(x => {
          count[x.day] = (count[x.day] || 0) + 1;
          (voters[x.email] = voters[x.email] || new Set()).add(x.day);
          if (x.email === email) saved.add(x.day);
        });
        sel = new Set(saved);
        draw(); best(); countdown(); whoList();
      }

      function dirty() {
        if (sel.size !== saved.size) return true;
        for (const d of sel) if (!saved.has(d)) return true;
        return false;
      }

      function draw() {
        const y = view.getFullYear(), m = view.getMonth();
        $('cal-title').textContent = view.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
        const max = Math.max(1, ...Object.values(count));
        const first = (new Date(y, m, 1).getDay() + 6) % 7;
        const dim = new Date(y, m + 1, 0).getDate();
        let h = '';
        for (let i = 0; i < first; i++) h += '<span></span>';
        for (let d = 1; d <= dim; d++) {
          const k = y + '-' + pad(m + 1) + '-' + pad(d);
          const n = count[k] || 0;
          const level = n ? Math.min(3, Math.ceil(n / max * 3)) : 0;
          const past = k < todayIso;
          h += '<button class="cal-day' + (past ? ' past' : '') + (level ? ' h' + level : '') + (sel.has(k) ? ' mine' : '') + '" data-d="' + k + '"' + (past ? ' disabled' : '') + '>' + d + (n ? '<small>' + n + '</small>' : '') + '</button>';
        }
        $('cal-grid').innerHTML = h;
        const diff = (y - today.getFullYear()) * 12 + m - today.getMonth();
        $('cal-prev').disabled = diff <= 0;
        $('cal-next').disabled = diff >= MAXM;
        $('when-save').disabled = !dirty() || !email;
      }

      function best() {
        const N = +$('when-n').value;
        const all = Object.values(voters);
        const res = [];
        for (let i = 0; i < 540; i++) {
          const s = new Date(today); s.setDate(s.getDate() + i);
          const days = []; for (let j = 0; j < N; j++) { const t = new Date(s); t.setDate(t.getDate() + j); days.push(iso(t)); }
          const n = all.filter(set => days.every(d => set.has(d))).length;
          if (n) res.push({ start: s, end: new Date(s.getTime() + (N - 1) * 864e5), n: n });
        }
        res.sort((a, b) => b.n - a.n || a.start - b.start);
        const picked = [];
        for (const r of res) { if (picked.every(p => Math.abs(p.start - r.start) >= N * 864e5)) picked.push(r); if (picked.length === 3) break; }
        const f = d => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
        $('when-best').innerHTML = picked.length
          ? picked.map(r => '<li><span>' + f(r.start) + ' → ' + f(r.end) + ' ' + r.end.getFullYear() + '</span><b>' + r.n + (r.n > 1 ? ' members' : ' member') + '</b></li>').join('')
          : '<li>No common dates yet. Add yours!</li>';
      }


      // ---- Countdown synced with the period chosen by the majority ----
      let target = null, cdCity = '';
      async function countdown() {
        try {
          const r = await fetch('https://dykofnyhwusghfowfxbi.supabase.co/rest/v1/meeting_votes?select=city,country', { headers: H });
          const vs = r.ok ? await r.json() : [];
          const g = {}; vs.forEach(v => { const k = v.city + (v.country ? ', ' + v.country : ''); g[k] = (g[k] || 0) + 1; });
          cdCity = Object.entries(g).sort((a, b) => b[1] - a[1])[0];
          cdCity = cdCity ? cdCity[0] : '';
        } catch (e) { cdCity = ''; }
        const V = Object.keys(voters).length;
        target = null;
        if (V >= 2) {
          const need = Math.floor(V / 2) + 1;
          const days = Object.keys(count).filter(d => count[d] >= need).sort();
          const runs = []; let cur = null;
          days.forEach(d => {
            const t = new Date(d + 'T00:00:00');
            if (cur && t - cur.last === 864e5) { cur.last = t; cur.sum += count[d]; }
            else { cur = { first: t, last: t, sum: count[d] }; runs.push(cur); }
          });
          runs.sort((a, b) => b.sum - a.sum || a.first - b.first);
          if (runs[0]) target = runs[0];
        }
        tick();
      }
      function tick() {
        const box = $('cd-body'); if (!box) return;
        if (!target) { box.innerHTML = '<p class="cd-msg">Vote the dates below: the countdown starts as soon as most of the team agrees.</p>'; return; }
        const f = d => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
        const range = target.first.getTime() === target.last.getTime() ? f(target.first) : f(target.first) + ' → ' + f(target.last) + ' ' + target.last.getFullYear();
        const info = '<p class="cd-info"><strong>' + range + '</strong>' + (cdCity ? ' · <strong>' + cdCity.replace(/[&<>"]/g, '') + '</strong>' : '') + '<br>The period chosen by the majority</p>';
        const now = new Date(), end = new Date(target.last.getTime() + 864e5);
        if (now >= end) { box.innerHTML = '<p class="cd-msg">The meeting is over. Time to choose the next one!</p>'; return; }
        if (now >= target.first) { box.innerHTML = '<p class="cd-msg">🌊 It is happening NOW! Enjoy the Tsunami Meeting!</p>' + info; return; }
        let ms = target.first - now;
        const d = Math.floor(ms / 864e5); ms -= d * 864e5;
        const h = Math.floor(ms / 36e5); ms -= h * 36e5;
        const m = Math.floor(ms / 6e4), sec = Math.floor((ms - m * 6e4) / 1e3);
        box.innerHTML = '<div class="cd-nums"><div class="cd-days"><b>' + d + '</b><span>days</span></div><div><b>' + pad(h) + '</b><span>hours</span></div><div><b>' + pad(m) + '</b><span>min</span></div><div><b>' + pad(sec) + '</b><span>sec</span></div></div>' + info;
      }
      setInterval(tick, 1000);

      $('cal-grid').addEventListener('click', function (e) {
        const b = e.target.closest('.cal-day'); if (!b || b.disabled) return;
        const d = b.dataset.d;
        sel.has(d) ? sel.delete(d) : sel.add(d);
        b.classList.toggle('mine', sel.has(d));
        $('when-save').disabled = !dirty() || !email;
        $('when-msg').textContent = '';
        const who = Object.keys(voters).filter(x => x !== email && voters[x].has(d)).map(nameOf);
        if (sel.has(d)) who.unshift('you');
        const x = d.split('-');
        $('when-day').innerHTML = '<b>' + (+x[2]) + ' ' + MONS[+x[1] - 1] + '</b>: ' + (who.length ? esc(who.join(', ')) : 'nobody yet');
      });
      $('cal-prev').onclick = function () { view = new Date(view.getFullYear(), view.getMonth() - 1, 1); draw(); };
      $('cal-next').onclick = function () { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); draw(); };
      $('when-n').onchange = best;
      $('when-clear').onclick = function () { sel = new Set(); draw(); $('when-msg').textContent = 'Selection cleared. Press Save to confirm.'; };

      $('when-save').onclick = async function () {
        if (!email) return;
        $('when-save').disabled = true; $('when-msg').textContent = 'Saving…';
        const add = [...sel].filter(d => !saved.has(d)), del = [...saved].filter(d => !sel.has(d));
        try {
          if (add.length) {
            const r = await fetch(SB + '?on_conflict=email,day', { method: 'POST', headers: Object.assign({ Prefer: 'resolution=merge-duplicates,return=minimal' }, H), body: JSON.stringify(add.map(d => ({ email: email, day: d }))) });
            if (!r.ok) throw 0;
          }
          if (del.length) {
            const r = await fetch(SB + '?email=eq.' + encodeURIComponent(email) + '&day=in.(' + del.join(',') + ')', { method: 'DELETE', headers: H });
            if (!r.ok) throw 0;
          }
          await load();
          $('when-msg').textContent = 'Saved. Thank you!';
        } catch (e) { $('when-msg').textContent = 'Sorry, your dates could not be saved. Please try again.'; $('when-save').disabled = false; }
      };

      const dw = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      $('cal-dows').innerHTML = dw.map(x => '<span class="cal-dow">' + x + '</span>').join('');
      draw();
    })();
