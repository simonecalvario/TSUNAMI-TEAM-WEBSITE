(function () {
  var K = 'tt_lock_ts', G = 60000;
  function ok() { try { var t = +localStorage.getItem(K) || 0; return !!t && Date.now() - t < G; } catch (e) { return false; } }
  var alive = ok();
  function touch() { if (alive) { try { localStorage.setItem(K, String(Date.now())); } catch (e) {} } }
  touch(); setInterval(function () { if (!document.hidden) touch(); }, 10000);
  document.addEventListener('visibilitychange', touch); window.addEventListener('pagehide', touch);
})();
