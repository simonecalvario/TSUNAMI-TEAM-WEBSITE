/* Gallery page header: which meeting, who was there, its memorabilia, previous/next meeting. */
(function () {
  const $ = id => document.getElementById(id), esc = TT.esc;
  const key = (new URLSearchParams(location.search).get('m') || '').toLowerCase();
  const i = TT.MEETINGS.findIndex(m => m.key === key);
  if (i < 0) { location.replace('/#journey'); return; }
  const M = window.ttMeeting = TT.MEETINGS[i];
  document.title = M.name + ' | Tsunami Gallery';
  $('g-label').textContent = 'Tsunami Meeting ' + M.year + ' · ' + M.icon + ' ' + M.country;
  $('g-title').innerHTML = esc(M.name) + ' <span>Gallery</span>';
  const prev = TT.MEETINGS[i - 1], next = TT.MEETINGS[i + 1];
  $('g-nav').innerHTML = (prev ? '<a href="gallery.html?m=' + prev.key + '">← ' + prev.icon + ' ' + esc(prev.name) + ' ' + prev.year + '</a>' : '<span></span>') +
    (next ? '<a href="gallery.html?m=' + next.key + '">' + next.icon + ' ' + esc(next.name) + ' ' + next.year + ' →</a>' : '<a href="/#meetings">🔜 The next one →</a>');

  async function extras() {
    const [nk, att, mem] = await Promise.all([
      TT.nicks(), TT.api.get('attendance?select=email&meeting=eq.' + M.key),
      TT.api.get('memorabilia?select=title,image_url&meeting_key=eq.' + M.key + '&order=created_at.desc')
    ]);
    const name = e => (nk.find(x => x.email === e) || {}).nickname || 'A member';
    const who = (att || []).map(a => name(a.email)).sort();
    $('g-who').innerHTML = who.length
      ? '<b>🛂 ' + who.length + ' on board:</b> ' + who.map(esc).join(' · ')
      : 'Were you there? Stamp it in your <a href="/#passport">Passport</a>.';
    $('g-mem').innerHTML = (mem || []).length
      ? '<h2>🎽 Memorabilia from ' + esc(M.name) + '</h2><div class="g-mem">' + mem.map(m => '<figure><img src="' + esc(m.image_url) + '" alt="" loading="lazy"><figcaption>' + esc(m.title) + '</figcaption></figure>').join('') + '</div>'
      : '';
  }
  window.ttGalleryExtras = extras;
  extras();
})();
