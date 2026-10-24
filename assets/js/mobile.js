(function () {
  const mq = window.matchMedia('(max-width: 700px)');
  const secs = Array.prototype.slice.call(document.querySelectorAll('main > section'));
  const MAIN = ['home', 'meetings', 'lagoon', 'blog', 'passport'];
  const bar = document.getElementById('tabbar'), sheet = document.getElementById('m-sheet'), footer = document.querySelector('footer');
  // Sections shown together on phones: the Statute lives under Philosophy.
  const GROUP = { statute: 'philosophy' }, WITH = { philosophy: ['statute'] };
  let cur = 'home';

  // While the More menu is open the page behind it must not scroll.
  function sheetOpen(on) {
    sheet.classList.toggle('open', on);
    document.documentElement.classList.toggle('sheet-open', on);
  }

  // iPhone ignores overflow: hidden on the page, so drags outside the menu (or on a menu that fits) are stopped here.
  document.addEventListener('touchmove', function (e) {
    if (!sheet.classList.contains('open')) return;
    const inside = e.target.closest && e.target.closest('#m-sheet');
    if (!inside || sheet.scrollHeight <= sheet.clientHeight) e.preventDefault();
  }, { passive: false });

  /* ---- Lagoon as a full-screen chat on phones ----
     The chat sits between the header and the tab bar and follows the keyboard (visualViewport),
     so on Android and iPhone the input stays visible and only the messages scroll. */
  const chat = document.querySelector('#lagoon .chat'), header = document.querySelector('header');
  function fitChat() {
    const on = mq.matches && cur === 'lagoon';
    document.documentElement.classList.toggle('chat-on', on);
    if (!on || !chat) return;
    const vv = window.visualViewport, H = vv ? vv.height : window.innerHeight, off = vv ? vv.offsetTop : 0;
    const kb = window.innerHeight - H > 120 || (document.activeElement && document.activeElement.id === 'chat-in' && window.innerHeight < screen.height * 0.6);
    const top = kb ? 0 : (header ? header.getBoundingClientRect().bottom : 0), tb = kb ? 0 : bar.getBoundingClientRect().height;
    chat.style.setProperty('--chat-top', Math.max(0, off + top) + 'px');
    chat.style.setProperty('--chat-h', Math.max(160, H - top - tb) + 'px');
  }
  if (window.visualViewport) { visualViewport.addEventListener('resize', fitChat); visualViewport.addEventListener('scroll', fitChat); }
  window.addEventListener('resize', fitChat);
  window.addEventListener('orientationchange', function () { setTimeout(fitChat, 300); });
  document.addEventListener('focusin', function (e) { if (e.target.id === 'chat-in') setTimeout(fitChat, 250); });
  document.addEventListener('focusout', function (e) { if (e.target.id === 'chat-in') setTimeout(fitChat, 250); });
  // iPhone ignores overflow: hidden on the page: stop drags on the chat frame, let the messages scroll.
  document.addEventListener('touchmove', function (e) {
    if (!document.documentElement.classList.contains('chat-on') || sheet.classList.contains('open')) return;
    const t = e.target.closest ? e.target : null; if (!t) return;
    if (t.closest('#chat-list, #chat-in, #chat-sug, #bell-panel, #tour-card, #bb-pop, #m-sheet')) return;
    if (t.closest('#lagoon, header, #tabbar')) e.preventDefault();
  }, { passive: false });

  function show(id, keepScroll) {
    if (!secs.some(s => s.id === id)) id = 'home';
    const target = id; id = GROUP[id] || id;
    cur = id;
    const vis = [id].concat(WITH[id] || []);
    secs.forEach(s => s.classList.toggle('m-off', vis.indexOf(s.id) < 0));
    if (footer) footer.classList.toggle('m-off', id !== 'home');
    const key = MAIN.indexOf(id) > -1 ? id : 'more';
    Array.prototype.forEach.call(bar.children, b => b.classList.toggle('on', b.dataset.v === key));
    Array.prototype.forEach.call(sheet.querySelectorAll('button'), b => b.classList.toggle('on', b.dataset.v === id));
    sheetOpen(false);
    fitChat();
    if (id === 'lagoon') setTimeout(function () { fitChat(); if (window.ttChatBottom) window.ttChatBottom(); }, 80);
    if (target !== id) setTimeout(function () { const t = document.getElementById(target); if (t) t.scrollIntoView(); }, 30);
    else if (!keepScroll) window.scrollTo(0, 0);
    try { history.replaceState(null, '', '#' + target); } catch (e) {}
    setTimeout(function () { window.dispatchEvent(new Event('resize')); }, 60);
  }

  bar.addEventListener('click', function (e) {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.v === 'more') { sheetOpen(!sheet.classList.contains('open')); return; }
    show(b.dataset.v);
  });
  sheet.addEventListener('click', function (e) {
    const b = e.target.closest('button'); if (b) show(b.dataset.v);
  });
  document.addEventListener('click', function (e) {
    if (!mq.matches) return;
    if (!e.target.closest('#m-sheet, #tabbar') && sheet.classList.contains('open')) sheetOpen(false);
    const a = e.target.closest('a[href^="#"]'); if (!a) return;
    const id = a.getAttribute('href').slice(1);
    if (id && secs.some(s => s.id === id)) { e.preventDefault(); show(id); }
  });
  window.addEventListener('hashchange', function () {
    if (!mq.matches) return;
    const id = location.hash.slice(1);
    if (id && id !== cur && secs.some(s => s.id === id) && GROUP[id] !== cur) show(id);
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
    const parts = Array.prototype.slice.call(document.querySelectorAll('#passport .pp'));
    if (!parts.length) return;
    makeTabs('passport', parts.map(p => ({ key: p.dataset.pp, label: p.dataset.label, els: [p] })), parts[0].previousElementSibling);
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
      sheetOpen(false);
    }
    fitChat();
  }
  if (mq.addEventListener) mq.addEventListener('change', apply); else mq.addListener(apply);
  apply();
})();
