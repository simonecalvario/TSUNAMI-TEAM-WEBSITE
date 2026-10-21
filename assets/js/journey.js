/* "Our journey": a timeline of every Tsunami Meeting with its crew, photos and memorabilia. */
(function () {
  const tl = document.getElementById('journey-tl'); if (!tl) return;
  const esc = TT.esc, M = TT.MEETINGS;
  const fmtKm = n => Math.round(n).toLocaleString('en-GB') + ' km';
  let next = null, D = null;
  function render() {
    if (!D) return;
    const name = e => (D.nk.find(x => x.email === e) || {}).nickname || 'A member';
    let total = 0;
    const stops = M.map(function (m, i) {
      const crew = D.att.filter(a => a.meeting === m.key).map(a => name(a.email)).sort();
      const ph = D.ph.filter(p => p.meeting === m.key), mem = D.mem.filter(x => x.meeting_key === m.key);
      const hop = i ? TT.km(M[i - 1].coords, m.coords) : 0; total += hop;
      return '<li class="jr-stop"><div class="jr-dot">' + m.icon + '</div><div class="jr-card">' +
        '<div class="jr-top"><span class="jr-year">' + m.year + '</span>' + (hop ? '<span class="jr-hop">✈️ ' + fmtKm(hop) + ' from ' + esc(M[i - 1].name) + '</span>' : '<span class="jr-hop">🌊 Where it all began</span>') + '</div>' +
        '<h3>' + esc(m.name) + ' <small>' + esc(m.country) + '</small></h3>' +
        '<div class="jr-crew">' + (crew.length ? '<b>' + crew.length + ' on board:</b> ' + crew.map(esc).join(' · ') : 'Were you there? <a href="#passport">Stamp it</a>') + '</div>' +
        (ph.length ? '<div class="jr-ph">' + ph.slice(0, 5).map(p => '<img src="' + esc(p.image_url) + '" alt="" loading="lazy">').join('') + (ph.length > 5 ? '<span>+' + (ph.length - 5) + '</span>' : '') + '</div>' : '') +
        '<div class="jr-f"><a class="jr-go" href="gallery.html?m=' + m.key + '">📸 ' + (ph.length ? ph.length + ' photo' + (ph.length > 1 ? 's' : '') : 'Add the first photo') + ' →</a>' + (mem.length ? '<span>🎽 ' + mem.length + ' memorabilia</span>' : '') + '</div>' +
        '</div></li>';
    });
    const nxt = next && next.city ? next.city : null;
    stops.push('<li class="jr-stop jr-next"><div class="jr-dot">🔜</div><div class="jr-card"><div class="jr-top"><span class="jr-year">' +
      (next && next.first ? next.first.getFullYear() : 'Next') + '</span></div><h3>' + (nxt ? esc(nxt) + '?' : 'Where to next?') + '</h3>' +
      '<div class="jr-crew">' + (next && next.first ? 'Dates chosen by the majority: ' + next.first.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }) + '.' : 'The crew is still deciding. Your vote counts.') + '</div>' +
      '<div class="jr-f"><a class="jr-go" href="#meetings">🗳 Vote and plan →</a></div></div></li>');
    tl.innerHTML = stops.join('');
    const cc = new Set(M.map(m => m.cc)).size, people = new Set(D.att.map(a => a.email)).size;
    document.getElementById('journey-sum').innerHTML =
      '<div><b>' + M.length + '</b><span>meetings</span></div><div><b>' + cc + '</b><span>countries</span></div>' +
      '<div><b>' + fmtKm(total) + '</b><span>between stops</span></div><div><b>' + D.ph.length + '</b><span>photos</span></div>' + (people ? '<div><b>' + people + '</b><span>travellers</span></div>' : '');
  }
  async function load() {
    const [nk, att, ph, mem] = await Promise.all([
      TT.nicks(), TT.api.get('attendance?select=email,meeting'),
      TT.api.get('meeting_photos?select=meeting,image_url,created_at&order=created_at.desc'),
      TT.api.get('memorabilia?select=meeting_key')
    ]);
    D = { nk: nk, att: att || [], ph: ph || [], mem: mem || [] };
    render();
  }
  TT.when('next', n => { next = n; render(); });
  const sec = document.getElementById('journey');
  if ('IntersectionObserver' in window) new IntersectionObserver(function (en, o) { if (en.some(x => x.isIntersecting)) { o.disconnect(); load(); } }, { rootMargin: '300px' }).observe(sec);
  else load();
})();
