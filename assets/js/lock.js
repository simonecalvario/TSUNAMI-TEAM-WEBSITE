(function () {
  var KEY = 'tt_lock_cred', GRACE = 60000, avail = false, hiddenAt = 0, TSK = 'tt_lock_ts', skipUntil = 0;
  function stamp() { try { localStorage.setItem(TSK, String(Date.now())); } catch (e) {} }
  function fresh() { try { var t = +localStorage.getItem(TSK) || 0; return !!t && Date.now() - t < GRACE; } catch (e) { return false; } }
  var el = document.getElementById('lock'), msg = document.getElementById('lock-msg');
  function enabled() { try { return !!localStorage.getItem(KEY); } catch (e) { return false; } }
  function rnd(n) { var a = new Uint8Array(n); crypto.getRandomValues(a); return a; }
  function toB64(buf) { return btoa(String.fromCharCode.apply(null, new Uint8Array(buf))); }
  function fromB64(t) { return Uint8Array.from(atob(t), function (c) { return c.charCodeAt(0); }); }
  function lockNow() { if (!enabled()) return; el.classList.add('on'); document.documentElement.style.overflow = 'hidden'; msg.textContent = ''; tryAuto(); }
  function unlockUI() { stamp(); el.classList.remove('on'); document.documentElement.style.overflow = ''; msg.textContent = ''; }
  async function assertId() {
    await navigator.credentials.get({ publicKey: { challenge: rnd(32), rpId: location.hostname, userVerification: 'required', timeout: 60000,
      allowCredentials: [{ type: 'public-key', id: fromB64(localStorage.getItem(KEY)), transports: ['internal'] }] } });
  }
  async function verify() {
    try { await assertId(); unlockUI(); return true; }
    catch (e) { msg.textContent = 'Not recognised. Tap the button to try again.'; return false; }
  }
  var autoTried = false;
  function tryAuto() { if (autoTried) return; autoTried = true; setTimeout(function () { assertId().then(unlockUI).catch(function () {}); }, 250); }
  document.getElementById('lock-go').addEventListener('click', verify);

  window.ttLock = {
    _grace: function (n) { GRACE = n; },
    state: function () { return !avail ? 'unsupported' : (enabled() ? 'on' : 'off'); },
    toggle: async function () {
      if (enabled()) {
        try { await assertId(); localStorage.removeItem(KEY); } catch (e) {}
        return;
      }
      try {
        var cred = await navigator.credentials.create({ publicKey: {
          rp: { name: 'Tsunami Team', id: location.hostname },
          user: { id: rnd(16), name: 'member', displayName: 'Tsunami member' },
          challenge: rnd(32), timeout: 60000,
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
          authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'discouraged' }
        } });
        localStorage.setItem(KEY, toB64(cred.rawId));
      } catch (e) {}
    }
  };
  try {
    if (window.PublicKeyCredential && PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable)
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().then(function (v) { avail = !!v; }).catch(function () {});
  } catch (e) {}
  if (enabled()) { if (fresh()) stamp(); else lockNow(); }
  function alive() { if (!el.classList.contains('on')) stamp(); }
  setInterval(function () { if (!document.hidden) alive(); }, 10000);
  window.addEventListener('pagehide', alive);
  document.addEventListener('click', function (e) { if (e.target && e.target.type === 'file') skipUntil = Date.now() + 600000; }, true);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { hiddenAt = Date.now(); alive(); return; }
    if (enabled() && !fresh() && Date.now() > skipUntil) { autoTried = false; lockNow(); } else alive();
  });
  window.addEventListener('pageshow', function (e) { if (e.persisted && enabled()) { autoTried = false; lockNow(); } });
})();
