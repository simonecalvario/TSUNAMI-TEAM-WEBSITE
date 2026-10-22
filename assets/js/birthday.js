/* Birthday Boost (home page): on a member's birthday every other member sends one emoji "wave".
   Two thirds of the crew fill the energy bar and unlock the Birthday Boost for the birthday member. */
(function () {
  const cont = document.querySelector('.hero-content'); if (!cont) return;
  const esc = TT.esc, enc = TT.enc, api = TT.api;
  const EMOJI = [['🌊', 'Wave'], ['🌪️', 'Tornado'], ['🏄', 'Surf'], ['🎉', 'Party'], ['🥂', 'Cheers'], ['🎂', 'Cake']];
  // Birthday quotes, different from the Daily Booster ones.
  const QUOTES = [
    ['Grow old along with me! The best is yet to be.', 'Robert Browning', 'Rabbi Ben Ezra (1864)'],
    ['With mirth and laughter let old wrinkles come.', 'William Shakespeare', 'The Merchant of Venice, Act I, Scene 1'],
    ['Wrinkles should merely indicate where smiles have been.', 'Mark Twain', 'Following the Equator (1897)'],
    ['May you live all the days of your life.', 'Jonathan Swift', 'Polite Conversation (1738)'],
    ['You can’t stop the waves, but you can learn to surf.', 'Jon Kabat-Zinn', 'Wherever You Go, There You Are (1994)'],
    ['Be water, my friend.', 'Bruce Lee', 'Interview with Pierre Berton (1971)'],
    ['Nothing in the world is softer or weaker than water, yet nothing is better at overcoming the hard and strong.', 'Lao Tzu', 'Tao Te Ching, chapter 78'],
    ['Life is either a daring adventure, or nothing.', 'Helen Keller', 'The Open Door (1957)'],
    ['The purpose of life is to live it, to taste experience to the utmost, to reach out eagerly and without fear for newer and richer experience.', 'Eleanor Roosevelt', 'You Learn by Living (1960)'],
    ['Friendship is born at that moment when one person says to another: “What! You too? I thought that no one but myself…”', 'C. S. Lewis', 'The Four Loves (1960)'],
    ['The good life is one inspired by love and guided by knowledge.', 'Bertrand Russell', 'What I Believe (1925)']
  ];
  const need = others => Math.max(1, Math.ceil(others * 2 / 3));
  const hash = t => { let h = 5381; for (let i = 0; i < t.length; i++) h = ((h << 5) + h + t.charCodeAt(i)) | 0; return h >>> 0; };

  const box = document.createElement('div'); box.id = 'bday-boost';
  const hint = document.getElementById('logo-hint');
  cont.insertBefore(box, hint ? hint.nextSibling : cont.firstChild);

  let email = null, nk = [], today = [], waves = {}, year = new Date().getFullYear();
  const name = e => (nk.find(x => x.email === e) || {}).nickname || 'A member';

  async function load() {
    const d = new Date(), bd = await api.get('birthdays?select=email,day,month&day=eq.' + d.getDate() + '&month=eq.' + (d.getMonth() + 1));
    year = d.getFullYear();
    today = (bd || []).filter(b => nk.some(n => n.email === b.email));
    if (!today.length) { box.innerHTML = ''; TT.set('bdayToday', []); return; }
    const w = await api.get('birthday_waves?select=*&year=eq.' + year + '&bday_email=in.(' + today.map(b => '"' + b.email + '"').join(',') + ')&order=created_at.asc');
    waves = {}; today.forEach(b => { waves[b.email] = (w || []).filter(x => x.bday_email === b.email); });
    TT.set('bdayToday', today.map(b => ({ email: b.email, mine: waves[b.email].some(x => x.email === email) })));
    render();
  }

  function bar(b) {
    const others = nk.filter(n => n.email !== b.email).length, nd = need(others), got = waves[b.email].length;
    const pct = Math.min(100, Math.round(got / nd * 100)), full = got >= nd, all = got >= others && others > 0;
    return { got: got, nd: nd, others: others, full: full, all: all,
      html: '<div class="bb-bar' + (full ? ' full' : '') + '"><i style="width:' + pct + '%"></i></div>' +
        '<div class="bb-count">' + (all ? '🌐 Full crew! Every member sent a wave' : full ? '⚡ Birthday Boost unlocked · ' + got + ' waves' : got + ' / ' + nd + ' waves to unlock the Birthday Boost') + '</div>' +
        (got ? '<div class="bb-who">' + waves[b.email].map(x => '<span title="' + esc(x.note || '') + '">' + x.emoji + ' ' + esc(name(x.email)) + '</span>').join('') + '</div>' : '') };
  }

  function card(b) {
    const B = bar(b), me = b.email === email, mine = waves[b.email].find(x => x.email === email);
    if (me) {
      return '<div class="bb-card me"><div class="bb-t">🎂 Happy birthday, ' + esc(name(b.email)) + '!</div>' +
        '<p class="bb-s">' + (B.full ? 'Your crew filled your energy bar.' : 'Your crew is charging your energy bar. When it is full, your Birthday Boost unlocks.') + '</p>' +
        B.html + (B.full ? '<button type="button" class="bb-open" data-bb="open">⚡ Open your Birthday Boost</button>' : '') + '</div>';
    }
    return '<div class="bb-card" data-e="' + esc(b.email) + '"><div class="bb-t">🎂 Today is ' + esc(name(b.email)) + '’s birthday!</div>' +
      '<p class="bb-s">' + (mine ? 'You sent ' + mine.emoji + '. Tap another one to change it.' : 'Send your wave: one tap fills the energy bar.') + '</p>' +
      '<div class="bb-emo">' + EMOJI.map(x => '<button type="button" data-w="' + x[0] + '" class="' + (mine && mine.emoji === x[0] ? 'on' : '') + '" aria-label="' + x[1] + '">' + x[0] + '</button>').join('') + '</div>' +
      '<input class="bb-note" maxlength="140" placeholder="Add a few words (optional)" value="' + esc(mine && mine.note || '') + '">' +
      B.html + '</div>';
  }

  function render() {
    box.innerHTML = today.map(card).join('');
    const mine = today.find(b => b.email === email);
    if (mine && bar(mine).full) {
      const k = 'tt_bboost_' + year;
      let seen = null; try { seen = localStorage.getItem(k); } catch (e) {}
      if (!seen) { try { localStorage.setItem(k, '1'); } catch (e) {} setTimeout(openBoost, 900); }
    }
  }

  function openBoost() {
    const b = today.find(x => x.email === email); if (!b || document.getElementById('bb-pop')) return;
    const greet = document.getElementById('bdg-pop'); if (greet) greet.remove();
    const B = bar(b), q = QUOTES[hash(email + year) % QUOTES.length], nm = name(email);
    const notes = waves[b.email].filter(x => x.note);
    const pop = document.createElement('div'); pop.id = 'bb-pop';
    pop.innerHTML = '<div class="bb-p"><div class="bb-big">⚡</div><div class="bb-k">Your Birthday Boost</div>' +
      '<h3>Happy birthday, ' + esc(nm) + '!</h3>' +
      '<p class="bb-msg">' + B.got + ' member' + (B.got > 1 ? 's' : '') + ' of the crew sent you their wave' + (B.all ? ': the whole crew!' : '.') + ' Wherever you are today, the connection is here. Stay liquid, keep making waves. 🌊</p>' +
      '<div class="bb-row">' + waves[b.email].map(x => '<span>' + x.emoji + '</span>').join('') + '</div>' +
      '<p class="bq-t">“' + esc(q[0]) + '”</p><div class="bq-a">— ' + esc(q[1]) + '</div><div class="bq-s">' + esc(q[2]) + '</div>' +
      (notes.length ? '<div class="bb-notes">' + notes.map(x => '<p>' + x.emoji + ' <b>' + esc(name(x.email)) + ':</b> ' + esc(x.note) + '</p>').join('') + '</div>' : '') +
      '<button type="button" data-bb="close">Thank you, crew! 🎉</button></div>';
    for (let i = 0; i < 40; i++) { const s = document.createElement('i'); s.className = 'cf'; s.textContent = ['🎂', '🌊', '⚡', '🎉', '🏄', '🥂'][i % 6]; s.style.left = Math.random() * 100 + '%'; s.style.animationDelay = (Math.random() * 1.8) + 's'; s.style.fontSize = (16 + Math.random() * 16) + 'px'; pop.appendChild(s); }
    pop.addEventListener('click', function (e) { if (e.target === pop || (e.target.dataset && e.target.dataset.bb === 'close')) pop.remove(); });
    document.body.appendChild(pop);
  }

  box.addEventListener('click', async function (e) {
    if (e.target.closest('[data-bb=open]')) { openBoost(); return; }
    const w = e.target.closest('[data-w]'); if (!w || !email) return;
    const c = w.closest('.bb-card'), bd = c.dataset.e, note = (c.querySelector('.bb-note').value || '').trim() || null;
    c.querySelectorAll('[data-w]').forEach(x => { x.disabled = true; });
    w.classList.add('pop');
    try { await api.upsert('birthday_waves', { bday_email: bd, year: year, email: email, emoji: w.dataset.w, note: note }, 'bday_email,year,email'); } catch (x) {}
    await load();
    if (window.ttReloadPass) setTimeout(window.ttReloadPass, 500);
  });
  box.addEventListener('change', async function (e) {
    const inp = e.target.closest('.bb-note'); if (!inp || !email) return;
    const c = inp.closest('.bb-card'), bd = c.dataset.e, mine = waves[bd] && waves[bd].find(x => x.email === email);
    if (mine) { await api.update('birthday_waves?bday_email=eq.' + enc(bd) + '&year=eq.' + year + '&email=eq.' + enc(email), { note: inp.value.trim() || null }).catch(() => {}); load(); }
  });

  Promise.all([TT.identity(), TT.nicks()]).then(function (r) { email = r[0]; nk = r[1]; load(); });
  setInterval(function () { if (!document.hidden && today.length && !box.contains(document.activeElement)) load(); }, 30000);
  window.ttBirthday = { reload: load, open: openBoost };
})();
