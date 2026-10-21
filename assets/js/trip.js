/* Trip room for the next Tsunami Meeting: RSVP and arrivals, checklist, shared expenses, calendar file. */
(function () {
  const box = document.getElementById('trip'); if (!box) return;
  const $ = id => document.getElementById(id), esc = TT.esc, enc = TT.enc, api = TT.api;
  const TRIP = 'next';
  const ST = { yes: ['✅', 'I’m in'], maybe: ['🤔', 'Maybe'], no: ['❌', 'Can’t make it'] };
  let email = null, nk = [], next = null, rsvp = [], items = [], exp = [];
  const name = e => (nk.find(x => x.email === e) || {}).nickname || 'A member';
  const me = () => rsvp.find(r => r.email === email) || null;
  const dt = v => v ? new Date(v).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
  const local = v => { if (!v) return ''; const d = new Date(v); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };
  const money = (n, c) => { try { return Number(n).toLocaleString('en-GB', { style: 'currency', currency: c }); } catch (e) { return Number(n).toFixed(2) + ' ' + c; } };
  const say = (id, t) => { const el = $(id); if (el) el.textContent = t; };

  async function load() {
    const [a, b, c] = await Promise.all([
      api.get('trip_rsvp?select=*&trip=eq.' + TRIP),
      api.get('trip_items?select=*&trip=eq.' + TRIP + '&order=id.asc'),
      api.get('trip_expenses?select=*&trip=eq.' + TRIP + '&order=id.desc')
    ]);
    if (a === null) { box.querySelector('.trip-grid').innerHTML = '<p class="vote-hint">The trip room is not available yet.</p>'; return; }
    rsvp = a; items = b || []; exp = c || [];
    render();
  }

  /* ---------- header + calendar ---------- */
  function ics() {
    const f = d => d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
    const end = new Date(next.last.getTime() + 864e5), stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
    const txt = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Tsunami Team//Trip room//EN', 'BEGIN:VEVENT',
      'UID:tsunami-' + f(next.first) + '@tsunamiteambeliquid.com', 'DTSTAMP:' + stamp,
      'DTSTART;VALUE=DATE:' + f(next.first), 'DTEND;VALUE=DATE:' + f(end),
      'SUMMARY:🌊 Tsunami Meeting' + (next.city ? ' – ' + next.city.replace(/([,;\\])/g, '\\$1') : ''),
      'DESCRIPTION:Friendship is liquid. https://www.tsunamiteambeliquid.com/#meetings',
      'URL:https://www.tsunamiteambeliquid.com/#meetings', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([txt], { type: 'text/calendar' }));
    a.download = 'tsunami-meeting.ics'; document.body.appendChild(a); a.click(); a.remove();
  }
  function head() {
    const yes = rsvp.filter(r => r.status === 'yes').length;
    const when = next && next.first ? next.first.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }) + (next.last && next.last > next.first ? ' → ' + next.last.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '') : 'Dates not decided yet';
    $('trip-head').innerHTML = '<div><b>' + esc(next && next.city ? next.city : 'City still being voted') + '</b><span>' + esc(when) + ' · ' + yes + ' coming</span></div>' +
      (next && next.first ? '<button type="button" class="button" id="trip-ics">📅 Add to calendar</button>' : '');
    const b = $('trip-ics'); if (b) b.onclick = ics;
  }

  /* ---------- RSVP ---------- */
  function rsvpView() {
    const m = me(), s = m ? m.status : '';
    $('trip-rsvp').innerHTML = '<div class="trip-st">' + Object.keys(ST).map(k => '<button type="button" data-st="' + k + '" class="' + (s === k ? 'on' : '') + '">' + ST[k][0] + ' ' + ST[k][1] + '</button>').join('') + '</div>' +
      (s && s !== 'no' ? '<div class="trip-form"><label>Arrival <input type="datetime-local" id="trip-arr" value="' + local(m.arrive_at) + '"></label><label>Departure <input type="datetime-local" id="trip-dep" value="' + local(m.depart_at) + '"></label>' +
        '<input id="trip-note" maxlength="200" placeholder="Flight, train, where you stay…" value="' + esc(m.note || '') + '"><button type="button" class="button" id="trip-save">Save</button><span id="trip-msg" class="vote-hint"></span></div>' : '');
    const order = { yes: 0, maybe: 1, no: 2 };
    const list = rsvp.slice().sort((a, b) => order[a.status] - order[b.status] || String(a.arrive_at || '9').localeCompare(String(b.arrive_at || '9')));
    $('trip-crew').innerHTML = list.length ? list.map(r => '<div class="tc-' + r.status + '"><b>' + ST[r.status][0] + ' ' + esc(name(r.email)) + (r.email === email ? ' (you)' : '') + '</b>' +
      (r.arrive_at ? '<small>🛬 ' + esc(dt(r.arrive_at)) + (r.depart_at ? ' · 🛫 ' + esc(dt(r.depart_at)) : '') + '</small>' : '') + (r.note ? '<small>' + esc(r.note) + '</small>' : '') + '</div>').join('')
      : '<p class="vote-hint">Nobody has answered yet. Be the first!</p>';
  }
  async function setStatus(k) {
    if (!email) return;
    const m = me();
    await api.upsert('trip_rsvp', { trip: TRIP, email: email, status: k, arrive_at: m ? m.arrive_at : null, depart_at: m ? m.depart_at : null, note: m ? m.note : null, updated_at: new Date().toISOString() }, 'trip,email');
    load();
  }
  async function saveRsvp() {
    const m = me(); if (!m) return;
    const v = id => $(id).value, iso = x => x ? new Date(x).toISOString() : null;
    try {
      await api.upsert('trip_rsvp', { trip: TRIP, email: email, status: m.status, arrive_at: iso(v('trip-arr')), depart_at: iso(v('trip-dep')), note: v('trip-note').trim() || null, updated_at: new Date().toISOString() }, 'trip,email');
      await load(); say('trip-msg', 'Saved ✓');
    } catch (e) { say('trip-msg', 'Could not save, try again.'); }
  }

  /* ---------- checklist ---------- */
  function itemsView() {
    const part = (kind, title, ph) => '<div class="ti-part"><h5>' + title + '</h5><ul>' + items.filter(i => i.kind === kind).map(i =>
      '<li class="' + (i.done_by ? 'done' : '') + '"><label><input type="checkbox" data-tick="' + i.id + '"' + (i.done_by ? ' checked' : '') + '> <span>' + esc(i.body) + '</span></label>' +
      '<small>' + (i.done_by ? '✓ ' + esc(name(i.done_by)) : 'by ' + esc(name(i.email))) + '</small>' + (i.email === email ? '<button type="button" class="ti-x" data-rm="' + i.id + '" aria-label="Remove">✕</button>' : '') + '</li>').join('') + '</ul>' +
      '<form class="ti-add" data-kind="' + kind + '"><input maxlength="200" placeholder="' + ph + '"><button type="submit">+</button></form></div>';
    $('trip-items').innerHTML = part('todo', 'To do', 'e.g. Book the table for Saturday') + part('bring', 'Who brings what', 'e.g. Speaker, flags, T-shirts…');
  }

  /* ---------- expenses ---------- */
  function balances() {
    const by = {};
    exp.forEach(x => {
      const c = x.currency, b = by[c] || (by[c] = {}), share = Number(x.amount) / x.split.length;
      b[x.email] = (b[x.email] || 0) + Number(x.amount);
      x.split.forEach(e => { b[e] = (b[e] || 0) - share; });
    });
    const out = [];
    Object.keys(by).forEach(c => {
      const pos = [], neg = [];
      Object.keys(by[c]).forEach(e => { const v = Math.round(by[c][e] * 100) / 100; if (v > 0.009) pos.push([e, v]); else if (v < -0.009) neg.push([e, -v]); });
      pos.sort((a, b) => b[1] - a[1]); neg.sort((a, b) => b[1] - a[1]);
      let i = 0, j = 0;
      while (i < neg.length && j < pos.length) {
        const n = Math.min(neg[i][1], pos[j][1]);
        out.push({ from: neg[i][0], to: pos[j][0], n: n, c: c });
        neg[i][1] -= n; pos[j][1] -= n;
        if (neg[i][1] < 0.01) i++; if (pos[j][1] < 0.01) j++;
      }
    });
    return out;
  }
  function expView() {
    const people = Array.from(new Set(rsvp.filter(r => r.status !== 'no').map(r => r.email).concat(email ? [email] : [])));
    const all = Array.from(new Set(people.concat(nk.map(n => n.email))));
    const settle = balances(), tot = {};
    exp.forEach(x => { tot[x.currency] = (tot[x.currency] || 0) + Number(x.amount); });
    $('trip-exp').innerHTML =
      '<form id="te-add" class="te-add"><input id="te-amt" type="number" min="0.01" step="0.01" placeholder="Amount" required>' +
      '<select id="te-cur">' + ['EUR', 'GBP', 'USD', 'CHF', 'QAR'].map(c => '<option>' + c + '</option>').join('') + '</select>' +
      '<input id="te-note" maxlength="120" placeholder="What for? (dinner, taxi…)" required><button class="button" type="submit">Add</button>' +
      '<div class="te-split"><span>Split between:</span>' + all.map(e => '<label><input type="checkbox" value="' + esc(e) + '"' + (people.indexOf(e) > -1 ? ' checked' : '') + '> ' + esc(name(e)) + '</label>').join('') + '</div><span id="te-msg" class="vote-hint"></span></form>' +
      (settle.length ? '<div class="te-settle"><h5>To settle up</h5>' + settle.map(s => '<div' + (s.from === email || s.to === email ? ' class="mine"' : '') + '><b>' + esc(name(s.from)) + '</b> → <b>' + esc(name(s.to)) + '</b><span>' + money(s.n, s.c) + '</span></div>').join('') + '</div>'
        : (exp.length ? '<p class="vote-hint">All square 🤝</p>' : '')) +
      (exp.length ? '<h5>All expenses · ' + Object.keys(tot).map(c => money(tot[c], c)).join(' + ') + '</h5><ul class="te-list">' + exp.map(x =>
        '<li><span><b>' + esc(x.note) + '</b><small>' + esc(name(x.email)) + ' paid · split ' + x.split.length + ' ways</small></span><span>' + money(x.amount, x.currency) + (x.email === email ? ' <button type="button" class="ti-x" data-rmx="' + x.id + '" aria-label="Remove">✕</button>' : '') + '</span></li>').join('') + '</ul>'
        : '<p class="vote-hint">No expenses yet. Add the first one when someone pays for the group.</p>');
  }

  function render() { head(); rsvpView(); itemsView(); expView(); }

  box.addEventListener('click', async function (e) {
    const st = e.target.closest('[data-st]'); if (st) { setStatus(st.dataset.st); return; }
    if (e.target.id === 'trip-save') { saveRsvp(); return; }
    const rm = e.target.closest('[data-rm]');
    if (rm && confirm('Remove this item?')) { await api.remove('trip_items?id=eq.' + rm.dataset.rm + '&email=eq.' + enc(email)).catch(() => {}); load(); return; }
    const rx = e.target.closest('[data-rmx]');
    if (rx && confirm('Remove this expense?')) { await api.remove('trip_expenses?id=eq.' + rx.dataset.rmx + '&email=eq.' + enc(email)).catch(() => {}); load(); }
  });
  box.addEventListener('change', async function (e) {
    const t = e.target.closest('[data-tick]'); if (!t || !email) return;
    await api.update('trip_items?id=eq.' + t.dataset.tick, { done_by: t.checked ? email : null }).catch(() => {});
    load();
  });
  box.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!email) return;
    const f = e.target;
    if (f.classList.contains('ti-add')) {
      const inp = f.querySelector('input'), body = inp.value.trim(); if (!body) return;
      inp.disabled = true;
      try { await api.insert('trip_items', { trip: TRIP, kind: f.dataset.kind, body: body, email: email }); inp.value = ''; } catch (x) {}
      inp.disabled = false; load();
    } else if (f.id === 'te-add') {
      const split = Array.from(f.querySelectorAll('.te-split input:checked')).map(x => x.value);
      if (!split.length) { say('te-msg', 'Choose at least one person.'); return; }
      try {
        await api.insert('trip_expenses', { trip: TRIP, email: email, amount: Math.round(+$('te-amt').value * 100) / 100, currency: $('te-cur').value, note: $('te-note').value.trim(), split: split });
        load();
      } catch (x) { say('te-msg', 'Could not save, check the amount.'); }
    }
  });

  TT.when('next', n => { next = n; if (nk.length || rsvp.length) head(); });
  Promise.all([TT.identity(), TT.nicks()]).then(r => { email = r[0]; nk = r[1]; load(); });
  setInterval(function () { if (!document.hidden && !box.contains(document.activeElement)) load(); }, 60000);
})();
