/* Time capsule: messages sealed until the first day of the next Tsunami Meeting. */
(function () {
  const box = document.getElementById('cap-body'); if (!box) return;
  const esc = TT.esc, api = TT.api;
  const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const today = iso(new Date());
  const nice = d => new Date(d + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  let email = null, nk = [], next = null, sealed = [], opened = [];
  const name = e => (nk.find(x => x.email === e) || {}).nickname || 'A member';
  function openDate() { if (next && next.first) return iso(next.first); const d = new Date(); d.setFullYear(d.getFullYear() + 1); return iso(d); }

  async function load() {
    const [s, o] = await Promise.all([api.rpc('capsule_sealed'), api.get('capsule?select=email,nickname,body,open_at,created_at&open_at=lte.' + today + '&order=created_at.asc')]);
    sealed = s || []; opened = o || [];
    render();
  }
  function render() {
    const n = sealed.reduce((a, r) => a + Number(r.n), 0), mine = sealed.find(r => r.email === email);
    const first = sealed.map(r => r.open_at).sort()[0];
    const auto = next && next.first;
    let h = '<div class="cap-seal"><div class="cap-ic">' + (n ? '🔒' : '📭') + '</div><div><b>' + (n ? n + ' sealed message' + (n > 1 ? 's' : '') + ' from ' + sealed.length + ' member' + (sealed.length > 1 ? 's' : '') : 'The capsule is empty') + '</b>' +
      '<small>' + (n ? 'Opening on ' + nice(first) + (mine ? ' · you wrote ' + mine.n : '') : 'Be the first to leave something for the future crew.') + '</small></div></div>';
    h += '<form id="cap-form" class="cap-form"><textarea id="cap-text" rows="3" maxlength="2000" placeholder="Dear team of the future… a memory, a promise, a dare for the next meeting."></textarea>' +
      '<div class="cap-row">' + (auto ? '<span class="vote-hint">Opens on <b>' + nice(openDate()) + '</b>, the first day of the next meeting.</span>' : '<label class="vote-hint">Opens on <input type="date" id="cap-date" min="' + today + '" value="' + openDate() + '"></label>') +
      '<button class="button" type="submit">Seal it 🔒</button></div><span id="cap-msg" class="vote-hint"></span></form>';
    if (opened.length) h += '<h4 class="cap-h">📬 Opened capsules</h4>' + opened.slice().reverse().map(c => '<div class="cap-open"><p>' + esc(c.body) + '</p><small>— ' + esc(c.nickname || name(c.email)) + ', written ' + new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + ' · opened ' + nice(c.open_at) + '</small></div>').join('');
    box.innerHTML = h;
    const cn = document.getElementById('cap-n'); if (cn) cn.textContent = n ? '· ' + n + ' sealed' : (opened.length ? '· ' + opened.length + ' opened' : '');
  }
  box.addEventListener('submit', async function (e) {
    e.preventDefault(); if (!email) return;
    const t = document.getElementById('cap-text').value.trim(), msg = document.getElementById('cap-msg');
    if (!t) { msg.textContent = 'Write something first.'; return; }
    const d = document.getElementById('cap-date'), at = d ? d.value : openDate();
    if (!at || at <= today) { msg.textContent = 'Choose a date in the future.'; return; }
    try { await api.insert('capsule', { email: email, nickname: name(email), body: t, open_at: at }); await load(); document.getElementById('cap-msg').textContent = 'Sealed! 🔒 See you on ' + nice(at) + '.'; }
    catch (x) { msg.textContent = 'Could not seal it, try again.'; }
  });
  TT.when('next', n => { next = n; if (email !== null) render(); });
  Promise.all([TT.identity(), TT.nicks()]).then(r => { email = r[0]; nk = r[1]; load(); });
})();
