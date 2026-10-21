(function () {
  const BASE = 'https://dykofnyhwusghfowfxbi.supabase.co';
  const MEMBERS = [['Antonio','Toro Loco'],['Biagio','Biageo'],['Carlos','Carlitos'],['Donato','The Boss'],['Francesco','Frankie'],['Marcos','Tronco'],['Massimo','Jack Hammer'],['Pietro','Uncle Peter'],['Rinaldo','Rino'],['Salvatore','Kraken'],['Saskia','Alaaf Kia'],['Simone','Don Simon'],['Tessa','Tres Tess']];
  const g = document.getElementById('cs-gate'), opts = document.getElementById('cs-opts'), ok = document.getElementById('cs-ok'), msg = document.getElementById('cs-msg');
  let email = null, JWT = null, chosen = null;
  JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5a29mbnlod3VzZ2hmb3dmeGJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwNjUwOTQsImV4cCI6MjEwNzY0MTA5NH0.wLS75UXlm2evHg1mlvjvrlJASDP9KRaE_b8fhnJ8htI';
  function esc(t) { return String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  async function open() {
    if (!email) return;
    let taken = [];
    try { const r = await fetch(BASE + '/rest/v1/nicknames?select=nickname', { headers: hdr() }); if (r.ok) taken = (await r.json()).map(x => x.nickname.toLowerCase()); } catch (e) {}
    opts.innerHTML = MEMBERS.map(function (m, i) {
      const off = taken.indexOf(m[1].toLowerCase()) > -1;
      return '<label class="' + (off ? 'off' : '') + '"><input type="radio" name="cs" value="' + i + '"' + (off ? ' disabled' : '') + '> <span>' + esc(m[0]) + ' – <b>' + esc(m[1]) + (off ? '</b> <small>(taken)</small>' : '</b>') + '</span><i>' + (off ? '' : '○') + '</i></label>';
    }).join('');
    g.classList.add('on'); document.body.style.overflow = 'hidden';
  }
  window.openCallsignGate = open;
  opts.addEventListener('change', function (e) {
    chosen = MEMBERS[+e.target.value];
    Array.prototype.forEach.call(opts.children, l => l.classList.toggle('sel', l.contains(e.target)));
    Array.prototype.forEach.call(opts.querySelectorAll('i'), (x, i) => { if (!x.parentNode.classList.contains('off')) x.textContent = x.parentNode.classList.contains('sel') ? '✓' : '○'; });
    ok.disabled = false; ok.textContent = 'Continue as ' + chosen[0] + ' →';
  });
  const s1 = document.getElementById('cs-step1'), s2 = document.getElementById('cs-step2'), yes = document.getElementById('cs-yes');
  ok.addEventListener('click', function () {
    if (!chosen) return;
    document.getElementById('cs-card').innerHTML = '<small>' + esc(chosen[0]) + '</small>call sign: <b style="color:var(--yellow)">' + esc(chosen[1]) + '</b>';
    s1.style.display = 'none'; s2.style.display = ''; g.scrollTop = 0;
  });
  document.getElementById('cs-back').addEventListener('click', function () { s2.style.display = 'none'; s1.style.display = ''; msg.textContent = ''; });
  yes.addEventListener('click', async function () {
    if (!chosen) return;
    yes.disabled = true; msg.textContent = 'Saving…';
    try {
      const r = await fetch(BASE + '/rest/v1/nicknames', { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json', Prefer: 'return=minimal' }, hdr()), body: JSON.stringify({ email: email, nickname: chosen[1] }) });
      if (!r.ok) throw new Error('x');
      location.reload();
    } catch (e) { msg.textContent = 'That call sign was just taken, or you already have one. Reload and try again.'; yes.disabled = false; }
  });
  function hdr() { return { apikey: JWT, Authorization: 'Bearer ' + JWT }; }
  fetch('/cdn-cgi/access/get-identity', { credentials: 'same-origin' })
    .then(r => r.ok ? r.json() : {})
    .then(async function (j) {
      if (!j || !j.email) return;
      email = j.email.toLowerCase(); document.getElementById('cs-who').textContent = 'Signed in as ' + email;
      const r = await fetch(BASE + '/rest/v1/nicknames?select=nickname&email=eq.' + encodeURIComponent(email), { headers: hdr() });
      if (!r.ok) return;
      if (!(await r.json()).length) open();
    }).catch(function () {});
})();
