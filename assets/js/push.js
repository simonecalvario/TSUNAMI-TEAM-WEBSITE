(function () {
  var BASE = 'https://dykofnyhwusghfowfxbi.supabase.co', PUB = 'BIZygphZe69F81urAeiXeObdY3I781Loy8UN4T6THbGQlNu_bbLDmF86rIvnKqPwBeB5tOWcyvi0_9W6dM1KhM0', JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5a29mbnlod3VzZ2hmb3dmeGJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwNjUwOTQsImV4cCI6MjEwNzY0MTA5NH0.wLS75UXlm2evHg1mlvjvrlJASDP9KRaE_b8fhnJ8htI';
  var H = { apikey: JWT, Authorization: 'Bearer ' + JWT, 'Content-Type': 'application/json' };
  var email = null, st = 'checking', reg = null;
  var iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var standalone = window.navigator.standalone === true || (window.matchMedia && matchMedia('(display-mode: standalone)').matches);

  function key(b64) {
    var p = '='.repeat((4 - b64.length % 4) % 4), r = atob((b64 + p).replace(/-/g, '+').replace(/_/g, '/'));
    return Uint8Array.from(r, function (c) { return c.charCodeAt(0); });
  }
  function b64(buf) { return btoa(String.fromCharCode.apply(null, new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  async function save(sub) {
    var j = sub.toJSON();
    await fetch(BASE + '/rest/v1/push_subscriptions?on_conflict=endpoint', { method: 'POST', headers: Object.assign({ Prefer: 'resolution=merge-duplicates,return=minimal' }, H),
      body: JSON.stringify({ endpoint: sub.endpoint, email: email, p256dh: j.keys.p256dh, auth: j.keys.auth }) });
  }
  async function refresh() {
    if (iOS && !standalone) { st = 'install'; return; }
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) { st = 'unsupported'; return; }
    if (Notification.permission === 'denied') { st = 'denied'; return; }
    try {
      reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      var sub = await reg.pushManager.getSubscription();
      if (sub && Notification.permission === 'granted') { st = 'on'; if (email) save(sub).catch(function () {}); }
      else st = 'off';
    } catch (e) { st = 'unsupported'; }
  }
  window.ttPush = {
    state: function () { return st; },
    toggle: async function () {
      if (st === 'on') {
        try {
          var sub = await reg.pushManager.getSubscription();
          if (sub) { await fetch(BASE + '/rest/v1/push_subscriptions?endpoint=eq.' + encodeURIComponent(sub.endpoint), { method: 'DELETE', headers: H }); await sub.unsubscribe(); }
        } catch (e) {}
        st = 'off'; return;
      }
      if (st !== 'off') return;
      try {
        var perm = await Notification.requestPermission();
        if (perm !== 'granted') { st = perm === 'denied' ? 'denied' : 'off'; return; }
        var s2 = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key(PUB) });
        await save(s2); st = 'on';
      } catch (e) { st = 'off'; }
    }
  };
  fetch('/cdn-cgi/access/get-identity', { credentials: 'same-origin' }).then(function (r) { return r.ok ? r.json() : {}; })
    .then(function (j) { if (j && j.email) email = j.email.toLowerCase(); return refresh(); }).catch(function () { refresh(); });
})();
