(function () {
  var meta = document.querySelector('meta[name="tt-build"]'); if (!meta) return;
  var mine = meta.content, last = 0;
  function check() {
    if (Date.now() - last < 20000) return; last = Date.now();
    fetch(location.pathname + '?_=' + Date.now(), { cache: 'no-store', credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.text() : ''; })
      .then(function (t) {
        var m = t.match(/name="tt-build" content="([^"]+)"/);
        if (!m || m[1] === mine) return;
        try { if (sessionStorage.getItem('tt_rl') === m[1]) return; sessionStorage.setItem('tt_rl', m[1]); } catch (e) {}
        location.reload();
      }).catch(function () {});
  }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) check(); });
  window.addEventListener('pageshow', function (e) { if (e.persisted) check(); });
  setTimeout(check, 1500);
})();
