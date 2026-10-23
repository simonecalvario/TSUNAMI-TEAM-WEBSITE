/* App setup: until the member has done it, every visit opens a short guided setup —
   add to Home Screen (phones), then push notifications and Face ID inside the app.
   Browsers allow none of these without a tap, so each step is one big button. */
(function () {
  const ua = navigator.userAgent || '';
  const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const android = /Android/i.test(ua);
  const standalone = window.navigator.standalone === true || (window.matchMedia && matchMedia('(display-mode: standalone)').matches);
  const phone = ios || android;
  let installEv = null;
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); installEv = e; if (box) render(); });
  const SNOOZE = 'tt_setup_later';
  let box = null, busy = false;

  const pushState = () => (window.ttPush ? window.ttPush.state() : 'unsupported');
  const lockState = () => (window.ttLock ? window.ttLock.state() : 'unsupported');

  // The steps still to do on this device.
  function todo() {
    if (phone && !standalone) return ['install'];
    const out = [];
    const p = pushState();
    if (p === 'off' || p === 'denied') out.push('push');
    if (phone && lockState() === 'off') out.push('lock');
    return out;
  }
  const allSteps = () => (phone && !standalone ? ['install', 'push', 'lock'] : phone ? ['push', 'lock'] : ['push']);

  function stepHtml(s) {
    if (s === 'install') {
      if (ios) return '<div class="su-ic">📲</div><h3>Add Tsunami to your Home Screen</h3>' +
        '<p>It becomes an app: full screen, notifications and Face ID. It takes 10 seconds.</p>' +
        '<ol><li>Tap <b>Share</b> <span class="su-share">⬆︎</span> in the Safari bar' + (/CriOS|FxiOS|EdgiOS/.test(ua) ? ' (open this site in <b>Safari</b> first)' : '') + '.</li>' +
        '<li>Scroll and tap <b>Add to Home Screen</b>.</li><li>Tap <b>Add</b>, then open Tsunami from the new icon.</li></ol>' +
        '<div class="su-arrow" aria-hidden="true">⬇︎</div>';
      return '<div class="su-ic">📲</div><h3>Install the Tsunami app</h3><p>Full screen, notifications and fingerprint lock.' + (installEv ? ' One tap.' : '') + '</p>' +
        (installEv ? '<button type="button" class="su-go" data-su="install">Install the app</button>'
          : /SamsungBrowser/.test(ua)
            ? '<ol><li>Tap the <b>☰</b> menu at the bottom.</li><li>Tap <b>Add page to</b> → <b>Home screen</b>.</li><li>Open Tsunami from the new icon.</li></ol>'
            : '<ol><li>Tap the <b>⋮</b> menu of Chrome (top right).</li><li>Tap <b>Install app</b> (or <b>Add to Home screen</b>).</li><li>Open Tsunami from the new icon.</li></ol>');
    }
    if (s === 'push') {
      if (pushState() === 'denied') return '<div class="su-ic">🔕</div><h3>Notifications are blocked</h3><p>Allow them in your phone settings for Tsunami (Settings → Notifications → Tsunami), then come back.</p>';
      return '<div class="su-ic">🔔</div><h3>Turn on notifications</h3><p>Only when someone mentions you, replies to you or comments your posts. No spam.</p>' +
        '<button type="button" class="su-go" data-su="push">Turn on notifications</button>';
    }
    const bio = ios ? 'Face ID' : 'fingerprint lock';
    return '<div class="su-ic">🔒</div><h3>Protect the app with ' + bio + '</h3><p>Opening Tsunami will ask for your face or fingerprint, so nobody else can read the team’s chat.</p>' +
      '<button type="button" class="su-go" data-su="lock">Turn on ' + bio + '</button>';
  }

  function render() {
    const left = todo();
    if (!left.length) { close(true); return; }
    const all = allSteps(), cur = left[0], n = all.indexOf(cur) + 1;
    box.innerHTML = '<div class="su"><div class="su-top"><span>Set up · step ' + n + ' of ' + all.length + '</span>' +
      '<div class="su-dots">' + all.map((s, i) => '<i class="' + (i < n - 1 ? 'ok' : i === n - 1 ? 'on' : '') + '"></i>').join('') + '</div></div>' +
      stepHtml(cur) + '<p class="su-msg" id="su-msg"></p><button type="button" class="su-later" data-su="later">Later</button></div>';
  }
  function close(done) {
    if (box) { box.remove(); box = null; }
    document.documentElement.classList.remove('su-open');
    if (done) try { sessionStorage.removeItem(SNOOZE); } catch (e) {}
  }
  function open() {
    if (box || !todo().length) return;
    try { if (sessionStorage.getItem(SNOOZE)) return; sessionStorage.setItem('tt_guide_seen', '1'); } catch (e) {}
    const gp = document.getElementById('guide-pop'); if (gp) gp.remove();
    box = document.createElement('div'); box.id = 'setup-pop';
    document.body.appendChild(box); document.documentElement.classList.add('su-open');
    box.addEventListener('click', async function (e) {
      const b = e.target.closest('[data-su]'); if (!b || busy) return;
      const a = b.dataset.su, msg = () => document.getElementById('su-msg');
      if (a === 'later') { try { sessionStorage.setItem(SNOOZE, '1'); } catch (x) {} close(false); return; }
      busy = true; b.disabled = true;
      try {
        if (a === 'install' && installEv) { installEv.prompt(); await installEv.userChoice; installEv = null; render(); }
        else if (a === 'push') { await window.ttPush.toggle(); if (pushState() !== 'on' && msg()) msg().textContent = pushState() === 'denied' ? 'Notifications were blocked.' : 'Not turned on. Tap the button again and choose Allow.'; }
        else if (a === 'lock') { await window.ttLock.toggle(); if (lockState() !== 'on' && msg()) msg().textContent = 'Not confirmed. Try again.'; }
      } catch (x) {}
      busy = false; if (box) { const m = msg() ? msg().textContent : ''; render(); if (m && msg()) msg().textContent = m; }
    });
    render();
  }

  // Start once the call-sign gate is closed and push/lock know their state.
  let tries = 0;
  (function wait() {
    const gate = document.getElementById('cs-gate');
    const ready = (!window.ttPush || pushState() !== 'checking') && !(gate && gate.classList.contains('on')) && !document.getElementById('lock')?.classList.contains('on');
    if (ready && tries > 4) return open();
    if (++tries < 60) setTimeout(wait, 500);
  })();
  document.addEventListener('visibilitychange', function () { if (!document.hidden && box) render(); });
  window.ttSetup = { open: function () { try { sessionStorage.removeItem(SNOOZE); } catch (e) {} open(); }, todo: todo };
})();
