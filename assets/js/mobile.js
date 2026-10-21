(function () {
  const mq = window.matchMedia('(max-width: 700px)');
  const secs = Array.prototype.slice.call(document.querySelectorAll('main > section'));
  const MAIN = ['home', 'meetings', 'lagoon', 'memorabilia', 'passport'];
  const bar = document.getElementById('tabbar'), sheet = document.getElementById('m-sheet'), footer = document.querySelector('footer');
  let cur = 'home';

  function show(id, keepScroll) {
    if (!secs.some(s => s.id === id)) id = 'home';
    cur = id;
    secs.forEach(s => s.classList.toggle('m-off', s.id !== id));
    if (footer) footer.classList.toggle('m-off', id !== 'home');
    const key = MAIN.indexOf(id) > -1 ? id : 'more';
    Array.prototype.forEach.call(bar.children, b => b.classList.toggle('on', b.dataset.v === key));
    Array.prototype.forEach.call(sheet.querySelectorAll('button'), b => b.classList.toggle('on', b.dataset.v === id));
    sheet.classList.remove('open');
    if (!keepScroll) window.scrollTo(0, 0);
    try { history.replaceState(null, '', '#' + id); } catch (e) {}
    setTimeout(function () { window.dispatchEvent(new Event('resize')); }, 60);
  }

  bar.addEventListener('click', function (e) {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.v === 'more') { sheet.classList.toggle('open'); return; }
    show(b.dataset.v);
  });
  sheet.addEventListener('click', function (e) {
    const b = e.target.closest('button'); if (b) show(b.dataset.v);
  });
  document.addEventListener('click', function (e) {
    if (!mq.matches) return;
    if (!e.target.closest('#m-sheet, #tabbar')) sheet.classList.remove('open');
    const a = e.target.closest('a[href^="#"]'); if (!a) return;
    const id = a.getAttribute('href').slice(1);
    if (id && secs.some(s => s.id === id)) { e.preventDefault(); show(id); }
  });
  window.addEventListener('hashchange', function () {
    if (!mq.matches) return;
    const id = location.hash.slice(1);
    if (id && id !== cur && secs.some(s => s.id === id)) show(id);
  });

  /* ---- sub-tabs inside long sections ---- */
  function makeTabs(secId, tabs, after) {
    const sec = document.getElementById(secId); if (!sec) return;
    const holder = document.createElement('div'); holder.className = 'subtabs';
    function pick(k) {
      tabs.forEach(t => t.els.forEach(el => el.classList.toggle('tp-off', t.key !== k)));
      Array.prototype.forEach.call(holder.children, b => b.classList.toggle('on', b.dataset.k === k));
      setTimeout(function () { window.dispatchEvent(new Event('resize')); }, 60);
    }
    tabs.forEach(t => {
      const b = document.createElement('button'); b.type = 'button'; b.dataset.k = t.key; b.textContent = t.label;
      b.addEventListener('click', function () { pick(t.key); });
      holder.appendChild(b);
    });
    after.parentNode.insertBefore(holder, after.nextSibling);
    pick(tabs[0].key);
  }
  const q = (sel) => Array.prototype.slice.call(document.querySelectorAll(sel));

  makeTabs('meetings', [
    { key: 'map', label: '🗺 Map', els: q('#meetings .pin-tip, #world-map') },
    { key: 'vote', label: '🗳 Vote city', els: q('#meetings .vote-box, #meetings .vote-panel') },
    { key: 'dates', label: '📅 Dates', els: q('#meetings .when-box') },
    { key: 'trip', label: '🧳 Trip', els: q('#meetings .trip-box') }
  ], document.getElementById('countdown'));

  (function () {
    const cont = document.querySelector('#passport .container');
    const kids = Array.prototype.slice.call(cont.children);
    const start = kids.indexOf(document.getElementById('stamps'));
    const crewAt = kids.findIndex(k => k.tagName === 'H3' && /crew/i.test(k.textContent));
    const bdAt = kids.findIndex(k => k.tagName === 'H3' && /birthday/i.test(k.textContent));
    const badgesAt = kids.indexOf(document.getElementById('badges'));
    const wrAt = kids.findIndex(k => k.tagName === 'H3' && /wrapped/i.test(k.textContent));
    makeTabs('passport', [
      { key: 'st', label: '🛂 Stamps', els: kids.slice(start, badgesAt) },
      { key: 'bg', label: '🏅 Badges', els: [kids[badgesAt]] },
      { key: 'cr', label: '👥 Crew', els: kids.slice(crewAt, bdAt) },
      { key: 'bd', label: '🎂 Birthdays', els: kids.slice(bdAt, wrAt > -1 ? wrAt : undefined) },
      { key: 'wr', label: '🎁 Wrapped', els: wrAt > -1 ? kids.slice(wrAt) : [] }
    ], kids[start - 1]);
  })();

  /* ---- founders swipe hint ---- */
  (function () {
    const g = document.querySelector('.founder-grid'); if (!g) return;
    const h = document.createElement('p'); h.className = 'swipe-hint'; h.textContent = '← swipe to meet the founders →';
    g.parentNode.insertBefore(h, g);
  })();

  function apply() {
    document.body.classList.toggle('m', mq.matches);
    if (mq.matches) {
      const id = location.hash.slice(1);
      show(secs.some(s => s.id === id) ? id : 'home', true);
    } else {
      secs.forEach(s => s.classList.remove('m-off'));
      if (footer) footer.classList.remove('m-off');
      sheet.classList.remove('open');
    }
  }
  if (mq.addEventListener) mq.addEventListener('change', apply); else mq.addListener(apply);
  apply();
})();
