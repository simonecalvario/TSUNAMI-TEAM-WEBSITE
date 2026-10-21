/* Founders cards: "Read more", the member's level and the meetings they lived. */
(function () {
  const cards = Array.prototype.slice.call(document.querySelectorAll('.founder-card'));
  if (!cards.length) return;
  const esc = TT.esc;
  cards.forEach(function (c) {
    const d = c.querySelector('.desc'); if (!d) return;
    const chips = document.createElement('div'); chips.className = 'fc-chips';
    d.parentNode.insertBefore(chips, d);
    const b = document.createElement('button'); b.type = 'button'; b.className = 'fc-more'; b.textContent = 'Read more ▾';
    b.addEventListener('click', function () { const o = c.classList.toggle('open'); b.textContent = o ? 'Show less ▴' : 'Read more ▾'; });
    d.parentNode.insertBefore(b, d.nextSibling);
  });
  const callOf = c => ((c.querySelector('.callsign') || {}).textContent || '').replace(/^\s*Call sign:\s*/i, '').trim().toLowerCase();
  let att = null;
  async function paint(levels) {
    const nk = await TT.nicks();
    if (!att) att = (await TT.api.get('attendance?select=email,meeting')) || [];
    cards.forEach(function (c) {
      const n = nk.find(x => String(x.nickname).toLowerCase() === callOf(c)), box = c.querySelector('.fc-chips');
      if (!n || !box) return;
      const lv = (levels || []).find(x => x.e === n.email);
      const st = TT.MEETINGS.filter(m => att.some(a => a.email === n.email && a.meeting === m.key));
      box.innerHTML = (lv ? '<span class="lvl" title="' + lv.xp + ' XP">' + lv.ic + ' ' + esc(lv.n) + '</span>' : '') +
        st.map(m => '<span title="' + esc(m.name) + ' ' + m.year + '">' + m.icon + ' ' + m.year + '</span>').join('');
    });
  }
  TT.when('levels', paint);
})();
