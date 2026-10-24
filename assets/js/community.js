    (function () {
      const BASE = 'https://dykofnyhwusghfowfxbi.supabase.co';
      const JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5a29mbnlod3VzZ2hmb3dmeGJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwNjUwOTQsImV4cCI6MjEwNzY0MTA5NH0.wLS75UXlm2evHg1mlvjvrlJASDP9KRaE_b8fhnJ8htI';
      const H = { apikey: JWT, Authorization: 'Bearer ' + JWT };
      const HJ = Object.assign({ 'Content-Type': 'application/json' }, H);
      const R = BASE + '/rest/v1/';
      const $ = id => document.getElementById(id);
      const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
      const MEETINGS = TT.MEETINGS;
      async function get(q) { try { const r = await fetch(R + q, { headers: H }); return r.ok ? await r.json() : null; } catch (e) { return null; } }
      let email = null, nick = null, nicks = [];

      function shrink(file) {
        return new Promise(function (ok, fail) {
          const img = new Image();
          img.onload = function () {
            const k = Math.min(1, 1280 / Math.max(img.width, img.height));
            const c = document.createElement('canvas');
            c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
            c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
            c.toBlob(b => b ? ok(b) : fail(), 'image/jpeg', 0.82);
          };
          img.onerror = fail; img.src = URL.createObjectURL(file);
        });
      }


      /* ---------------- SITE GUIDE ---------------- */
      const GUIDE = [
        ['Your first steps', [
          ['🎂', 'Birthday and city', 'Passport → My passport: on the first page tap Birthday and Home. The team will celebrate with you, and Find the Team will show how far you are.'],
          ['🗳', 'Vote the next city', 'Meetings → Vote city. Votes are public, with call signs.'],
          ['📅', 'Mark your free dates', 'Meetings → Dates. Find the days that work for everyone.'],
          ['🛂', 'Collect your stamps', 'Passport → My passport. Swipe to the visa pages and tap the meetings you lived.'],
          ['📸', 'Add photos to the galleries', 'Meetings → Map. Tap a pin to open that meeting’s gallery: add photos, react with emojis and comment.'],
          ['🎂', 'Birthday waves', 'On a member’s birthday, tap an emoji on the home page: the team fills their energy bar and unlocks their Birthday Boost (at 21:00 it opens anyway, with every wave and message).'],
          ['🌅', 'Open your Daily Booster', 'Tap the logo on the home page every day: a quote to start your day, and badges to earn.'],
          ['💬', 'Say hi in the Lagoon', 'Use @callsign to tag someone, and reply to messages.'],
          ['📍', 'Find the Team', 'More → Find the Team: everyone on the map with the distances. Add where you will be on holidays or trips.']
        ]],
        ['What’s where', [
          ['📖', 'Blog', 'More → Blog: post stories, photos and memories; comment, react with emojis and tag someone with @.'],
          ['👥', 'Founders', 'More → Founders: the 13 founders of the team.'],
          ['🌊', 'Philosophy & Statute', 'More → Philosophy & Statute: what we believe, the experiences we share and our founding words.'],
          ['📍', 'Meetings', 'Map of our meetings, city vote and dates. Tap a pin for its gallery: add photos, react and comment.'],
          ['🧳', 'Trip room', 'Meetings → Trip: say if you are coming, your arrival, the checklist, shared expenses and the time capsule.'],
          ['🧭', 'Our journey', 'More → Our journey: every Tsunami Meeting so far, with the team, photos and souvenirs, and your yearly Wrapped.'],
          ['🎽', 'Memorabilia', 'Pieces and merch of the team: add yours too.'],
          ['💬', 'Lagoon', 'The team chat.'],
          ['🛂', 'Passport', 'My passport: photo, birthday, city, level, badges and meeting stamps. Team passports: open the passport of any member (read only).'],
          ['📍', 'Find the Team', 'More → Find the Team: where everyone is today and how far apart we are. Tap a name for the distances from them.'],
          ['🏅', 'Badges & levels', 'More → Badges & levels: the Team XP ranking, every badge, how to earn it and your progress.'],
          ['📋', 'Activity Log', 'More → Activity Log: everything that happens, in order: transparency for all.'],
          ['🌅', 'Daily Booster', 'Tap the logo on the home page: one quote a day. Read it daily to earn badges!']
        ]],
        ['Good to know', [
          ['🔔', 'The bell', 'Shows what to do and who mentioned you. Turn on push alerts there.'],
          ['🏅', 'Badges', 'Earn XP with everything you do. Some badges are secret…'],
          ['📲', 'Use it like an app', 'Add the site to your Home Screen (iPhone: Share → Add to Home Screen · Android: ⋮ → Install app). Face ID lock is in the bell.']
        ]]
      ];
      function guideShow() {
        if ($('guide-pop')) return;
        const KEY = 'tt_guide_off_' + email;
        const box = document.createElement('div'); box.id = 'guide-pop';
        box.innerHTML = '<div class="gd"><div class="gd-h"><b>Welcome to Tsunami Team 🌊</b><small>Quick guide to the site</small></div><div class="gd-b">' +
          GUIDE.map(g => '<h4>' + g[0] + '</h4>' + g[1].map(r => '<div class="gd-r"><i>' + r[0] + '</i><div><b>' + esc(r[1]) + '</b> — ' + esc(r[2]) + '</div></div>').join('')).join('') +
          '</div><div class="gd-f"><button type="button" class="go" data-a="tour">▶ Start the guided tour</button><button type="button" class="sec" data-a="off">Don’t show again</button><button type="button" data-a="ok" class="sec">Close</button></div></div>';
        box.addEventListener('click', function (e) {
          const a = e.target.getAttribute && e.target.getAttribute('data-a');
          if (a === 'off') { try { localStorage.setItem(KEY, '1'); } catch (x) {} box.remove(); }
          else if (a === 'tour') { box.remove(); tourStart(); }
          else if (a === 'ok' || e.target === box) box.remove();
        });
        document.body.appendChild(box);
      }

      /* ---------------- GUIDED TOUR ---------------- */
      /* ---- install as app (iPhone / Android) ---- */
      const INST = (function () {
        const ua = navigator.userAgent || '';
        const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        const android = /Android/i.test(ua);
        const standalone = window.navigator.standalone === true || (window.matchMedia && matchMedia('(display-mode: standalone)').matches);
        const o = { ios: ios, android: android, standalone: standalone, ok: (ios || android) && !standalone, ev: null };
        window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); o.ev = e; });
        return o;
      })();
      function instSteps() {
        return INST.ios
          ? ['Open this site in <b>Safari</b>.', 'Tap the <b>Share</b> button (the square with an arrow, at the bottom).', 'Scroll down and tap <b>Add to Home Screen</b>.', 'Tap <b>Add</b>. Now open Tsunami Team from the new icon.']
          : ['Open this site in <b>Chrome</b>.', 'Tap the <b>⋮</b> menu (top right).', 'Tap <b>Install app</b> (or <b>Add to Home screen</b>).', 'Confirm with <b>Install</b>. Now open Tsunami Team from the new icon.'];
      }
      function instPop() {
        if ($('inst-pop')) return;
        const p = document.createElement('div'); p.id = 'inst-pop';
        p.innerHTML = '<div class="ip"><h3>📲 Use it like an app</h3><p class="ip-s">' + (INST.ios ? 'iPhone · needed for push notifications, and the Face ID lock works best too.' : 'Android · opens full screen, like a real app.') + '</p><ol>' + instSteps().map(x => '<li>' + x + '</li>').join('') + '</ol><div class="ip-b">' + (INST.ev ? '<button type="button" data-i="now">Install now</button>' : '') + '<button type="button" class="sec" data-i="ok">Got it</button></div></div>';
        document.body.appendChild(p);
        p.addEventListener('click', function (e) {
          const a = e.target.closest('[data-i]'); if (!a && e.target !== p) return;
          if (a && a.dataset.i === 'now' && INST.ev) { try { INST.ev.prompt(); } catch (x) {} }
          p.remove();
        });
      }
      const TOUR = [
        { ic: '🎂', t: 'Your birthday', d: 'On the first page of your passport tap Birthday, choose day and month and Save. The team will celebrate with you!', go: 'passport', tab: 'My passport', sel: '#pbook', act: () => { const c = $('tour-card'); if (c) c.classList.add('min', 'top'); if (window.ttPass) window.ttPass.edit('bd'); }, done: () => !!document.querySelector('#pbook [data-pe-open=bd][data-set]'), ok: '✓ Birthday saved' },
        { ic: '🏠', t: 'Your city', d: 'Now tap Home on the same page and search your city: the team sees where you live and how far apart we are.', go: 'passport', tab: 'My passport', sel: '#pbook', act: () => { const c = $('tour-card'); if (c) c.classList.add('min', 'top'); if (window.ttPass) window.ttPass.edit('city'); }, done: () => !!document.querySelector('#pbook [data-pe-open=city][data-set]'), ok: '✓ City saved' },
        { ic: '🛂', t: 'Your stamps', d: 'On the visa pages, tap the Tsunami Meetings you lived: each one stamps the meeting logo on your passport.', go: 'passport', tab: 'My passport', sel: '#pbook', act: () => { const c = $('tour-card'); if (c) c.classList.add('min', 'top'); if (window.ttPass) window.ttPass.page(2); }, done: () => !!document.querySelector('#pbook .stamp.on'), ok: '✓ You have at least one stamp' },
        { ic: '📍', t: 'Where: vote the city', d: 'Vote the city for the next Tsunami Meeting. Votes are public, with call signs.', go: 'meetings', tab: 'Vote city', sel: '#meetings .vote-box' },
        { ic: '📅', t: 'When: your free dates', d: 'Mark the days you are free, so we can find the best dates for everyone.', go: 'meetings', tab: 'Dates', sel: '#meetings .when-box' },
        { ic: '📸', t: 'Meeting galleries', d: 'Tap a pin on the map to open the gallery of that Tsunami Meeting: add your photos, react with an emoji and comment.', go: 'meetings', tab: 'Map', sel: '#world-map', nofocus: true },
        { ic: '📍', t: 'Find the Team', d: 'Everyone on the map, with the distances. Going on holiday or on a trip? Add it in “I’ll be at…” and the map uses that place for those days.', go: 'findteam', sel: '#findteam #cm-map', nofocus: true },
        { ic: '🌅', t: 'Your Daily Booster', d: 'Tap the logo for a quote to start your day. Read one every day to earn badges!', go: 'home', sel: '#booster-btn', act: () => { const bt = $('booster-btn'); if (bt) bt.click(); }, done: () => { const bt = $('booster-btn'); return !!bt && !bt.classList.contains('new'); }, ok: '✓ Today’s boost opened' },
        { ic: '🔔', t: 'Notifications & Face ID', d: 'Tap the bell: turn on push notifications to get alerts when someone mentions you, and the Face ID lock to protect the app.', go: null, sel: '#bell', panel: true, done: () => (window.ttPush && window.ttPush.state() === 'on') || (window.ttLock && window.ttLock.state() === 'on'), ok: '✓ Alerts or Face ID are on' },
        ...(INST.ok ? [{ ic: '📲', t: 'Use it like an app', d: 'Add the site to your Home Screen to open it like an app. On iPhone it is needed for push notifications. Tap Do it to see how.', go: 'home', sel: '#inst-banner, #logo-hint', act: () => instPop() }] : []),
        { ic: '💬', t: 'Say hi in the Lagoon', d: 'Write a greeting to the team. Tip: type @ and a call sign to tag someone!', go: 'lagoon', sel: '#chat-form' }
      ];
      let tourOpen = false, tourI = -1, tourTimer = null, tourRaf = 0;
      function tourEl(st) { if (st.panel && tourOpen) return $('bell-panel'); return Array.from(document.querySelectorAll(st.sel)).find(e => e.offsetParent !== null) || document.querySelector(st.sel) || document.getElementById(st.go); }
      function tourPanel(open) {
        const bp = $('bell-panel'), bb = $('bell'); if (!bp || !bb) return;
        if (bp.classList.contains('open') !== open) bb.click();
      }
      function tourStop() {
        tourPanel(false);
        tourI = -1; clearInterval(tourTimer); cancelAnimationFrame(tourRaf);
        ['tour-ring', 'tour-card'].forEach(id => { const e = $(id); if (e) e.remove(); });
      }
      function tourStart() { tourStop(); tourStep(0); }
      function tourStep(i) {
        tourI = i; tourOpen = false; clearInterval(tourTimer);
        if (i >= TOUR.length) return tourEnd();
        const st = TOUR[i];
        tourPanel(false);
        if (st.go && location.hash !== '#' + st.go) location.hash = '#' + st.go;
        if (st.tab) { const tb = Array.from(document.querySelectorAll('#' + st.go + ' .subtabs button')).find(b => b.textContent.indexOf(st.tab) > -1); if (tb) tb.click(); }
        let ring = $('tour-ring'), card = $('tour-card');
        if (!ring) { ring = document.createElement('div'); ring.id = 'tour-ring'; document.body.appendChild(ring); }
        if (!card) { card = document.createElement('div'); card.id = 'tour-card'; document.body.appendChild(card); }
        const last = i === TOUR.length - 1;
        card.innerHTML = '<div class="tc-top"><span>Step ' + (i + 1) + ' of ' + TOUR.length + '</span><button type="button" data-t="exit" aria-label="Close tour">✕</button></div><b>' + st.ic + ' ' + esc(st.t) + '</b><p>' + esc(st.d) + '</p><div class="tc-st" id="tc-st"></div><div class="tc-b"><button type="button" class="sec" data-t="skip">Skip it' + (last ? '' : ' →') + '</button><button type="button" data-t="doit" id="tc-next" data-last="' + (last ? 1 : 0) + '">Do it 👉</button></div>';
        setTimeout(function () {
          const el = tourEl(st); if (!el) return;
          try { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) { el.scrollIntoView(); }
        }, 250);
        cancelAnimationFrame(tourRaf);
        (function loop() {
          const r = $('tour-ring'); if (!r || tourI !== i) return;
          const el = tourEl(st);
          if (el) { const b = el.getBoundingClientRect(); r.style.display = ''; r.style.left = (b.left - 6) + 'px'; r.style.top = (b.top - 6) + 'px'; r.style.width = (b.width + 12) + 'px'; r.style.height = (b.height + 12) + 'px'; }
          else r.style.display = 'none';
          tourRaf = requestAnimationFrame(loop);
        })();
        if (st.done) {
          const chk = function () { const ok = st.done(), s2 = $('tc-st'), nx = $('tc-next'); if (!s2) return; s2.textContent = ok ? st.ok : ''; if (nx) nx.classList.toggle('pulse', !!ok); };
          chk(); tourTimer = setInterval(chk, 600);
        }
      }
      function tourEnd() {
        clearInterval(tourTimer); cancelAnimationFrame(tourRaf);
        const r = $('tour-ring'); if (r) r.remove();
        let card = $('tour-card'); if (!card) { card = document.createElement('div'); card.id = 'tour-card'; document.body.appendChild(card); }
        card.innerHTML = '<b>🌊 You are all set!</b><p>Enjoy the site. You can reopen the guide anytime from More → Site guide, or from the bell.</p><div class="tc-b"><button type="button" class="sec" data-t="off">Don’t show the guide again</button><button type="button" data-t="exit">Done 🎉</button></div>';
        tourI = TOUR.length;
      }
      document.addEventListener('click', function (e) {
        const b = e.target.closest && e.target.closest('#tour-card [data-t]'); if (!b) return;
        const a = b.dataset.t;
        if (a === 'next' || a === 'skip') tourStep(tourI + 1);
        else if (a === 'doit') {
          const st = TOUR[tourI]; if (!st) return;
          if (st.act) {
            b.dataset.t = 'next'; b.textContent = b.dataset.last === '1' ? 'Finish 🎉' : 'Next →';
            st.act(); return;
          }
          if (st.panel) {
            b.dataset.t = 'next'; b.textContent = b.dataset.last === '1' ? 'Finish 🎉' : 'Next →';
            tourOpen = true; setTimeout(function () { tourPanel(true); }, 60);
            const idx = tourI, pn = $('bell-panel');
            if (pn) pn.addEventListener('click', function () { setTimeout(function () { if (tourI !== idx) return; const s2 = $('tc-st'), nx = $('tc-next'); if (s2 && !s2.textContent) s2.textContent = '👍 Great! Tap Next when you are done'; if (nx) nx.classList.add('pulse'); }, 600); }, { once: true });
            return;
          }
          const el = tourEl(st), card = $('tour-card');
          if (card) card.classList.add('min', 'top');
          b.dataset.t = 'next'; b.textContent = b.dataset.last === '1' ? 'Finish 🎉' : 'Next →';
          if (el) {
            el.style.scrollMarginTop = '160px';
            try { el.scrollIntoView({ block: 'start', behavior: 'smooth' }); } catch (x) { el.scrollIntoView(); }
            const f = st.nofocus ? null : el.querySelector('input:not([type=hidden]),select,textarea,button');
            if (f) setTimeout(function () { try { f.focus({ preventScroll: true }); } catch (x) {} }, 450);
            const idx = tourI, touched = function () {
              if (tourI !== idx) return;
              const s2 = $('tc-st'), nx = $('tc-next');
              if (s2 && !s2.textContent) s2.textContent = '👍 Great! Tap Next when you are done';
              if (nx) nx.classList.add('pulse');
            };
            ['change', 'input', 'submit', 'click'].forEach(function (ev) { el.addEventListener(ev, function () { setTimeout(touched, 400); }, { once: true }); });
          }
        }
        else if (a === 'exit') tourStop();
        else if (a === 'off') { try { localStorage.setItem('tt_guide_off_' + email, '1'); } catch (x) {} tourStop(); }
      });

      function instBanner() {
        if (!INST.ok || $('inst-banner')) return;
        let off = false; try { off = localStorage.getItem('tt_inst_off_' + email) === '1'; } catch (e) {}
        const hint = $('logo-hint'); if (off || !hint) return;
        const b = document.createElement('div'); b.id = 'inst-banner';
        b.innerHTML = '<span class="ib-t">📲 Add this site to your Home Screen to use it like an app.</span><button type="button" class="ib-go">How?</button><button type="button" class="ib-x" aria-label="Hide">✕</button>';
        hint.parentNode.insertBefore(b, hint.nextSibling);
        b.querySelector('.ib-go').onclick = instPop;
        b.querySelector('.ib-x').onclick = function () { try { localStorage.setItem('tt_inst_off_' + email, '1'); } catch (x) {} b.remove(); };
      }
      function guideInit() {
        if (!email || !nick) return;
        instBanner();
        document.addEventListener('click', function (e) {
          const t = e.target.closest && e.target.closest('[data-guide]'); if (!t) return;
          e.preventDefault(); const sh = $('m-sheet'); if (sh) sh.classList.remove('open'); document.documentElement.classList.remove('sheet-open');
          const bp = $('bell-panel'); if (bp) bp.classList.remove('open');
          guideShow();
        });
        let off = false; try { off = localStorage.getItem('tt_guide_off_' + email) === '1'; } catch (e) {}
        let seen = false; try { seen = sessionStorage.getItem('tt_guide_seen') === '1'; } catch (e) {}
        if (!off && !seen) { try { sessionStorage.setItem('tt_guide_seen', '1'); } catch (e) {} setTimeout(guideShow, 900); }
      }

      async function init() {
        try {
          const r = await fetch('/cdn-cgi/access/get-identity', { credentials: 'same-origin' });
          const j = r.ok ? await r.json() : {};
          if (j && j.email) email = j.email.toLowerCase();
        } catch (e) {}
        nicks = (await get('nicknames?select=email,nickname')) || [];
        const m = nicks.find(x => x.email === email); nick = m ? m.nickname : null;
        chatInit(); passInit(); bdayInit(); bellInit(); actInit(); guideInit();
      }

      /* ---------------- CHAT ---------------- */
      let lastId = 0, chatBroken = false, near = true, replyTo = null, byId = {}, nicksAt = Date.now();
      const escRe = t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      function mentionRe() {
        const names = Array.from(new Set(nicks.map(x => x.nickname))).filter(Boolean).sort((a, b) => b.length - a.length);
        return names.length ? new RegExp('@(' + names.map(escRe).join('|') + ')(?![\\p{L}\\p{N}])', 'giu') : null;
      }
      function fmt(t) {
        const re = mentionRe(); let out = esc(t);
        if (re) out = out.replace(re, '<span class="mention">@$1</span>');
        return out;
      }
      function mentionsMe(m) {
        if (!nick) return false;
        const re = new RegExp('@' + escRe(nick) + '(?![\\p{L}\\p{N}])', 'iu');
        const orig = m.reply_to ? byId[m.reply_to] : null;
        return re.test(m.body) || !!(orig && orig.email === email);
      }
      function setReply(m) {
        replyTo = m;
        const bar = $('chat-reply');
        if (!m) { bar.style.display = 'none'; return; }
        bar.style.display = 'flex';
        bar.querySelector('span').innerHTML = 'Replying to <b>' + esc(m.nickname) + '</b>: ' + esc(m.body.slice(0, 70));
        $('chat-in').focus();
      }
      function suggest() {
        const inp = $('chat-in'), box = $('chat-sug');
        const before = inp.value.slice(0, inp.selectionStart || inp.value.length);
        const mt = before.match(/(?:^|\s)@([^@\s][^@]{0,23}|)$/u);
        if (!mt) { box.style.display = 'none'; return; }
        const q = mt[1].toLowerCase();
        const names = Array.from(new Set(nicks.map(x => x.nickname))).filter(n => n && n !== nick && n.toLowerCase().indexOf(q) === 0).slice(0, 8);
        if (!names.length) { box.style.display = 'none'; return; }
        box.innerHTML = names.map(n => '<button type="button" data-n="' + esc(n) + '">@' + esc(n) + '</button>').join('');
        box.style.display = 'flex';
      }
      function insertMention(n) {
        const inp = $('chat-in');
        const pos = inp.selectionStart || inp.value.length;
        const before = inp.value.slice(0, pos).replace(/@[^@]{0,24}$/u, '');
        inp.value = before + '@' + n + ' ' + inp.value.slice(pos);
        $('chat-sug').style.display = 'none'; inp.focus();
      }
      function chatInit() {
        const note = $('chat-note'), form = $('chat-form'), list = $('chat-list');
        if (!email) { note.textContent = 'Could not identify your account. Reload the page.'; return; }
        if (!nick) { note.innerHTML = 'To chat, first choose your call sign. <a href="#" onclick="openCallsignGate();return false;">Choose now</a>'; }
        else { note.style.display = 'none'; form.style.display = 'flex'; }
        const down = $('chat-down'), inp = $('chat-in');
        list.addEventListener('scroll', function () { near = list.scrollHeight - list.scrollTop - list.clientHeight < 80; if (near) down.classList.remove('show'); }, { passive: true });
        down.addEventListener('click', function () { near = true; list.scrollTop = list.scrollHeight; down.classList.remove('show'); });
        // The box grows with the text (up to ~5 lines). On a computer Enter sends and Shift+Enter is a new line;
        // on phones Enter is a new line and the Send button sends, like in messaging apps.
        const grow = function () { inp.style.height = 'auto'; inp.style.height = Math.min(inp.scrollHeight, 120) + 'px'; };
        inp.addEventListener('input', function () { grow(); suggest(); });
        inp.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && !matchMedia('(pointer: coarse)').matches) { e.preventDefault(); form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event('submit', { cancelable: true })); }
        });
        inp.addEventListener('focus', function () { if (near) setTimeout(function () { list.scrollTop = list.scrollHeight; }, 300); });
        window.ttChatBottom = function () { near = true; list.scrollTop = list.scrollHeight; };
        $('chat-sug').addEventListener('click', function (e) { const n = e.target.dataset.n; if (n) insertMention(n); });
        $('chat-reply-x').addEventListener('click', function () { setReply(null); });
        form.addEventListener('submit', async function (e) {
          e.preventDefault();
          const t = $('chat-in').value.trim(); if (!t || !nick) return;
          const body = { email: email, nickname: nick, body: t };
          if (replyTo) body.reply_to = replyTo.id;
          $('chat-in').value = ''; grow(); $('chat-sug').style.display = 'none';
          try {
            const r = await fetch(R + 'chat_messages', { method: 'POST', headers: Object.assign({ Prefer: 'return=minimal' }, HJ), body: JSON.stringify(body) });
            if (!r.ok) throw 0;
            setReply(null); near = true; poll();
          } catch (err) { $('chat-in').value = t; note.style.display = 'block'; note.textContent = replyTo ? 'Reply not sent. The database may still need the reply column (see instructions).' : 'Message not sent. Please try again.'; }
        });
        list.addEventListener('click', async function (e) {
          const id = e.target.dataset.x;
          if (id) { if (!confirm('Delete this message?')) return; await fetch(R + 'chat_messages?id=eq.' + id + '&email=eq.' + encodeURIComponent(email), { method: 'DELETE', headers: H }); lastId = 0; byId = {}; list.innerHTML = ''; poll(); return; }
          if (e.target.dataset.re) { const m = byId[e.target.dataset.re]; if (m && nick) setReply(m); return; }
          if (e.target.dataset.m && nick) { const inp = $('chat-in'); inp.value = (inp.value + ' @' + e.target.dataset.m + ' ').trimStart(); inp.focus(); return; }
          const q = e.target.closest('.quote');
          if (q) { const el = list.querySelector('[data-id="' + q.dataset.q + '"]'); if (el) { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); } }
        });
        poll(); setInterval(function () { if (!document.hidden) poll(); }, 4000);
      }
      let lastDay = '';
      async function poll() {
        const list = $('chat-list');
        if (Date.now() - nicksAt > 60000) { nicksAt = Date.now(); const n = await get('nicknames?select=email,nickname'); if (n) nicks = n; }
        const q = lastId ? 'chat_messages?select=*&id=gt.' + lastId + '&order=id.asc' : 'chat_messages?select=*&order=id.desc&limit=80';
        const rows = await get(q);
        if (rows === null) { if (!chatBroken) { chatBroken = true; $('chat-note').style.display = 'block'; $('chat-note').textContent = 'Connection lost, reconnecting…'; } return; }
        if (chatBroken) { chatBroken = false; if (nick) $('chat-note').style.display = 'none'; }
        if (!lastId) { rows.reverse(); lastDay = ''; byId = {}; }
        if (!rows.length) { if (!lastId && !list.children.length) list.innerHTML = '<div class="chat-day">No messages yet. Say hi 👋</div>'; return; }
        if (!lastId) list.innerHTML = '';
        rows.forEach(m => { byId[m.id] = m; });
        const frag = rows.map(m => {
          const d = new Date(m.created_at), ds = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
          let out = '';
          if (ds !== lastDay) { lastDay = ds; out += '<div class="chat-day">' + ds + '</div>'; }
          const me = m.email === email;
          const orig = m.reply_to ? byId[m.reply_to] : null;
          const quote = m.reply_to ? '<span class="quote" data-q="' + m.reply_to + '">' + (orig ? '↩ <b>' + esc(orig.nickname) + '</b> ' + esc(orig.body.slice(0, 80)) : '↩ original message') + '</span>' : '';
          out += '<div class="msg' + (me ? ' me' : '') + (!me && mentionsMe(m) ? ' tome' : '') + '" data-id="' + m.id + '"><small><b data-m="' + esc(m.nickname) + '">' + esc(m.nickname) + '</b> · ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + '<button class="re" data-re="' + m.id + '" title="Reply">↩</button>' + (me ? '<button class="x" data-x="' + m.id + '" title="Delete">✕</button>' : '') + '</small>' + quote + fmt(m.body) + '</div>';
          lastId = Math.max(lastId, m.id);
          return out;
        }).join('');
        const first = !list.children.length;
        list.insertAdjacentHTML('beforeend', frag);
        if (near || first) list.scrollTop = list.scrollHeight;
        else if (rows.some(m => m.email !== email)) $('chat-down').classList.add('show');
      }

      /* ---------------- PASSPORT + ALBUMS ---------------- */
      let att = [], photos = [], counts = { posts: 0, mem: 0, photos: 0 };

      /* ---------------- ACTIVITY LOG ---------------- */
      let actAt = 0, ACT = null, actF = 'all', actM = '', actN = 60, actBusy = false;
      const ACTF = [['all', 'All'], ['badge', '🏅 Badges'], ['level', '⭐ Levels'], ['content', '📖 Content'], ['chat', '💬 Chat'], ['team', '🙋 Team']];
      const ACTG = { wave: 'team', boost: 'team', rsvp: 'team', badge: 'badge', level: 'level', post: 'content', comment: 'content', photo: 'content', pcomm: 'content', preact: 'content', mem: 'content', chat: 'chat', stamp: 'team', vote: 'team', days: 'team', bday: 'team', join: 'team' };
      const ACTI = { wave: '🌊', boost: '⚡', rsvp: '🧳', badge: '🏅', level: '⭐', post: '📖', comment: '💭', photo: '📸', pcomm: '🖼️', preact: '😍', mem: '🎽', chat: '💬', stamp: '🛂', vote: '🗳', days: '📅', bday: '🎂', join: '🙋' };
      const tsOf = r => { const t = Date.parse(r.created_at); return isNaN(t) ? 0 : t; };
      async function getTs(table, cols, extra) {
        let r = await get(table + '?select=' + cols + ',created_at' + (extra || ''));
        if (r) { r.forEach(x => { x.ts = tsOf(x); }); return r; }
        r = await get(table + '?select=' + cols + (extra || ''));
        if (r) r.forEach(x => { x.ts = 0; });
        return r || [];
      }
      const dayKey = ts => { const d = new Date(ts); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
      const dayEnd = ts => { const d = new Date(ts); d.setHours(23, 59, 59, 999); return d.getTime(); };
      const asc = a => a.slice().sort((x, y) => x.ts - y.ts);
      const mName = k => { const m = MEETINGS.find(x => x.key === k); return m ? m.name : (k || 'a meeting'); };

      function actBuild(D, joins) {
        const ev = [], add = (ts, e, type, txt) => { if (ts && e) ev.push({ ts: ts, e: e, type: type, txt: txt }); };
        D.posts.forEach(p => add(p.ts, p.email, 'post', 'published the post “' + esc(p.title || '') + '”'));
        D.comments.forEach(c => add(c.ts, c.email, 'comment', 'commented on a Blog post'));
        D.photos.forEach(p => add(p.ts, p.email, 'photo', 'added a photo to the ' + esc(mName(p.meeting)) + ' gallery'));
        D.mem.forEach(m => add(m.ts, m.email, 'mem', 'added a Memorabilia piece'));
        (D.pc || []).forEach(c => add(c.ts, c.email, 'pcomm', 'commented on a gallery photo'));
        D.att.forEach(a => add(a.ts, a.email, 'stamp', 'collected the ' + esc(mName(a.meeting)) + ' stamp'));
        D.votes.forEach(v => add(v.ts, v.email, 'vote', 'voted for ' + esc(v.city || 'a city') + (v.country ? ' (' + esc(v.country) + ')' : '')));
        D.bd.forEach(b => add(b.ts, b.email, 'bday', 'saved their birthday'));
        joins.forEach(j => add(j.ts, j.email, 'join', 'joined the team as <b>' + esc(j.nickname) + '</b>'));
        const RS = { yes: 'is coming to the next Tsunami Meeting 🙌', maybe: 'might come to the next Tsunami Meeting', no: 'can’t make it to the next Tsunami Meeting' };
        (D.rsvp || []).forEach(r => add(r.ts, r.email, 'rsvp', RS[r.status] || 'answered the trip room'));
        const wb = {};
        (D.waves || []).forEach(w => { add(w.ts, w.email, 'wave', 'sent a ' + esc(w.emoji) + ' birthday wave to <b>' + esc(nickOf(w.bday_email) || 'a member') + '</b>'); (wb[w.bday_email + '|' + w.year] = wb[w.bday_email + '|' + w.year] || []).push(w); });
        Object.keys(wb).forEach(k => { const l = wb[k].sort((x, y) => x.ts - y.ts), nd = Math.max(1, Math.ceil(Math.max(0, nicks.length - 1) * 2 / 3)); if (l[nd - 1]) add(l[nd - 1].ts, k.split('|')[0], 'boost', 'got the <b>Birthday Boost</b> ⚡ from the team'); });

        const grp = (rows, type, fn) => {
          const g = {};
          rows.forEach(r => { if (!r.ts) return; const k = r.email + '|' + dayKey(r.ts); (g[k] = g[k] || { e: r.email, ts: 0, n: 0 }); g[k].n++; if (r.ts > g[k].ts) g[k].ts = r.ts; });
          Object.keys(g).forEach(k => add(g[k].ts, g[k].e, type, fn(g[k].n)));
        };
        grp(D.pr || [], 'preact', n => 'gave ' + n + ' emoji reaction' + (n > 1 ? 's' : '') + ' in the galleries');
        grp(D.chat, 'chat', n => 'wrote ' + n + ' message' + (n > 1 ? 's' : '') + ' in the Lagoon');
        grp(D.days, 'days', n => 'marked ' + n + ' free date' + (n > 1 ? 's' : '') + ' in the calendar');
        return ev;
      }

      function actReplay(D, onDone) {
        const S = {}; ['att', 'photos', 'posts', 'mem', 'comments', 'chat', 'votes', 'days', 'bd', 'reactions', 'boost', 'pr', 'pc', 'waves'].forEach(k => { S[k] = asc(D[k] || []); });
        const upto = (arr, t) => { let lo = 0, hi = arr.length; while (lo < hi) { const m = (lo + hi) >> 1; if (arr[m].ts <= t) lo = m + 1; else hi = m; } return arr.slice(0, lo); };
        const cps = {}, mark = (e, ts) => { if (e && ts) (cps[e] = cps[e] || new Set()).add(dayEnd(ts)); };
        let last = 0;
        Object.keys(S).forEach(k => S[k].forEach(r => { mark(r.email, r.ts); if (r.ts > last) last = r.ts; }));
        const emails = Object.keys(cps);
        const out = []; let i = 0;
        (function step() {
          const t0 = Date.now();
          while (i < emails.length && Date.now() - t0 < 25) {
            const e = emails[i++], list = Array.from(cps[e]).sort((a, b) => a - b);
            if (list[list.length - 1] < last) list.push(last);
            let pl = {}, pL = 0;
            list.forEach(c => {
              const Dt = {}; Object.keys(S).forEach(k => { Dt[k] = upto(S[k], c); });
              const M = metricsFor(e, Dt), when = Math.min(c, last);
              BADGES.forEach(b => {
                const l = lvlOf(b, M), p = pl[b.id] || 0;
                for (let x = p + 1; x <= l; x++) {
                  if (b.secret) out.push({ ts: when, e: e, type: 'badge', hl: 1, txt: 'unlocked a <b>secret badge</b> ✨' });
                  else out.push({ ts: when, e: e, type: 'badge', hl: 1, txt: 'unlocked ' + b.ic + ' <b>' + esc(b.n) + '</b>' + (b.t.length > 1 ? ' · ' + TI[x - 1 + (4 - b.t.length)] + ' ' + TN[x - 1 + (4 - b.t.length)] : '') });
                }
                pl[b.id] = l;
              });
              const sc = scoreOf(M);
              for (let L = pL + 1; L <= sc.L; L++) out.push({ ts: when, e: e, type: 'level', hl: 1, txt: 'reached level ' + LEVELS[L].ic + ' <b>' + LEVELS[L].n + '</b>' });
              pL = Math.max(pL, sc.L);
            });
          }
          if (i < emails.length) setTimeout(step, 0); else onDone(out);
        })();
      }

      async function actLoad() {
        if (actBusy) return; actBusy = true;
        const a = await Promise.all([
          getTs('attendance', 'email,meeting'), getTs('meeting_photos', 'id,email,meeting'), getTs('posts', 'id,email,title'),
          getTs('memorabilia', 'id,email,meeting_key,meeting_year'), getTs('comments', 'id,email', '&limit=5000'),
          getTs('chat_messages', 'id,email,body,reply_to', '&order=id.desc&limit=5000'), getTs('meeting_votes', 'email,city,country'),
          getTs('meeting_days', 'email,day', '&limit=10000'), getTs('birthdays', 'email,day,month'), getTs('reactions', 'target,email', '&limit=10000'),
          getTs('nicknames', 'email,nickname'), getTs('booster_reads', 'email,day,q', '&limit=20000'),
          getTs('photo_reactions', 'target,email,emoji', '&limit=20000'), getTs('photo_comments', 'id,photo_id,email', '&limit=5000'),
          getTs('trip_rsvp', 'email,status'), getTs('birthday_waves', 'bday_email,year,email,emoji')
        ]);
        const D = { att: a[0], photos: a[1], posts: a[2], mem: a[3], comments: a[4], chat: a[5], votes: a[6], days: a[7], bd: a[8], reactions: a[9], boost: a[11], pr: a[12], pc: a[13], rsvp: a[14], waves: a[15] };
        const joins = a[10];
        const base = actBuild(D, joins);
        actReplay(D, function (rep) {
          ACT = base.concat(rep).sort((x, y) => y.ts - x.ts || (x.hl ? 1 : 0) - (y.hl ? 1 : 0));
          actBusy = false; actRender();
        });
      }

      function actRender() {
        const f = $('act-f'), sel = $('act-m'), list = $('act-list'), more = $('act-more');
        if (!f || !ACT) return;
        f.innerHTML = ACTF.map(x => '<button type="button" data-k="' + x[0] + '" class="' + (x[0] === actF ? 'on' : '') + '">' + x[1] + '</button>').join('');
        const names = Array.from(new Set(ACT.map(x => nickOf(x.e)).filter(Boolean))).sort((a, b) => a.localeCompare(b));
        if (sel.dataset.n !== String(names.length)) {
          sel.dataset.n = names.length;
          sel.innerHTML = '<option value="">Everyone</option>' + names.map(n => '<option' + (n === actM ? ' selected' : '') + '>' + esc(n) + '</option>').join('');
        }
        const rows = ACT.filter(x => (actF === 'all' || ACTG[x.type] === actF) && (!actM || nickOf(x.e) === actM));
        if (!rows.length) { list.innerHTML = '<p class="vote-hint">Nothing here yet.</p>'; more.style.display = 'none'; return; }
        let h = '', day = '';
        rows.slice(0, actN).forEach(x => {
          const d = new Date(x.ts), dk = d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
          if (dk !== day) { day = dk; h += '<div class="act-day">' + dk + '</div>'; }
          h += '<div class="act-it' + (x.hl ? ' hl' : '') + '"><i>' + ACTI[x.type] + '</i><div><b>' + esc(nickOf(x.e) || 'A member') + '</b> ' + x.txt + '</div></div>';
        });
        list.innerHTML = h; more.style.display = rows.length > actN ? '' : 'none';
      }

      function actInit() {
        const f = $('act-f'); if (!f) return;
        f.addEventListener('click', function (e) { const b = e.target.closest('button'); if (b) { actF = b.dataset.k; actN = 60; actRender(); } });
        $('act-m').addEventListener('change', function () { actM = this.value; actN = 60; actRender(); });
        $('act-more').addEventListener('click', function () { actN += 60; actRender(); });
        const sec = $('activity');
        const load = function () { if (!actBusy && (!ACT || Date.now() - actAt > 90000)) { actAt = Date.now(); actLoad(); } };
        if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { if (en.some(x => x.isIntersecting)) load(); }, { threshold: 0.01 }).observe(sec);
        else load();
      }

      async function passInit() {
        loadPass();
        setInterval(function () { if (!document.hidden) loadPass(); }, 180000);
      }
      let DATA = null, myM = {};
      window.ttReloadPass = function () { return loadPass(); };
      async function loadPass() {
        const a = await Promise.all([
          get('attendance?select=email,meeting'), get('meeting_photos?select=id,email,meeting'),
          get('posts?select=id,email'), get('memorabilia?select=id,email,meeting_key,meeting_year'),
          get('comments?select=id,email&limit=5000'), get('chat_messages?select=id,email,body,created_at,reply_to&order=id.desc&limit=5000'),
          get('meeting_votes?select=email'), get('meeting_days?select=email,day&limit=10000'),
          get('birthdays?select=email,day,month'), get('reactions?select=target,email&limit=10000'),
          get('booster_reads?select=email,day,q&limit=20000'),
          get('photo_reactions?select=target,email,emoji&limit=20000'), get('photo_comments?select=id,photo_id,email&limit=5000'),
          get('birthday_waves?select=bday_email,year,email,emoji,created_at&limit=5000')
        ]);
        att = a[0]; photos = a[1] || [];
        const attOk = att !== null; if (!attOk) att = [];
        DATA = { att: att, photos: photos, posts: a[2] || [], mem: a[3] || [], comments: a[4] || [], chat: a[5] || [], votes: a[6] || [], days: a[7] || [], bd: a[8] || [], reactions: a[9] || [], boost: a[10] || [], pr: a[11] || [], pc: a[12] || [], waves: a[13] || [] };
        if (email) {
          myM = metricsFor(email, DATA);
          try {
            const key = 'tt_bdg_' + email, now = {}; BADGES.forEach(b => { now[b.id] = lvlOf(b, myM); });
            let prev = null; try { prev = JSON.parse(localStorage.getItem(key)); } catch (x) {}
            if (prev) {
              const ups = BADGES.filter(b => now[b.id] > (prev[b.id] || 0)).map(b => ({ b: b, l: now[b.id] }));
              if (ups.length) {
                celebrate(ups);
                let news = []; try { news = JSON.parse(localStorage.getItem('tt_bnews_' + email)) || []; } catch (x) {}
                ups.forEach(u => news.unshift({ t: Date.now(), txt: u.b.ic + ' ' + u.b.n + (u.b.t.length > 1 ? ' · ' + TN[u.l - 1 + (4 - u.b.t.length)] : '') }));
                localStorage.setItem('tt_bnews_' + email, JSON.stringify(news.slice(0, 8)));
              }
            }
            localStorage.setItem(key, JSON.stringify(now));
          } catch (x) {}
          renderBadges();
          TT.set('passport', Object.assign({ ok: attOk }, passOf(email, myM)));
        }
        renderCrew();
      }
      /* ---------------- BADGES / LEVELS ---------------- */
      const FOUNDERS = ['Toro Loco', 'Biageo', 'Carlitos', 'The Boss', 'Frankie', 'Tronco', 'Jack Hammer', 'Uncle Peter', 'Rino', 'Kraken', 'Alaaf Kia', 'Don Simon', 'Tres Tess'];
      const PALETTE = ['👍', '❤️', '😂', '😮', '😢', '😡'];
      const TI = ['🥉', '🥈', '🥇', '💎'], TN = ['Bronze', 'Silver', 'Gold', 'Platinum'], TP = [10, 25, 50, 100];
      const GREET = /(happy\s*b|b-?day|birthday|auguri|compleanno|cumple|feliz|geburtstag|alles gute|herzlichen|gefeliciteerd|verjaardag|joyeux|anniversaire)/i;
      const CATS = ['Journey', 'Memories', 'Social', 'Rhythm', 'Special'];
      const BADGES = [
        { id: 'rider', c: 'Journey', ic: '🌊', n: 'First Wave', m: 'stamps', t: [1, 3, 6, 10], u: 'stamps', d: 'Collect Tsunami Meeting stamps in your Passport.' },
        { id: 'globe', c: 'Memories', ic: '🌍', n: 'Globetrotter', m: 'countries', t: [3, 5, 8, 12], u: 'countries', d: 'Publish photos or Memorabilia from Tsunami Meetings held in different countries.' },
        { id: 'full', c: 'Journey', ic: '🌪️', n: 'Full Tsunami', m: 'fullT', t: [1], u: '', d: 'Collect the stamp of every Tsunami Meeting so far. You were always there!' },
        { id: 'story', c: 'Memories', ic: '✍️', n: 'Storyteller', m: 'posts', t: [1, 5, 15, 30], u: 'posts', d: 'Publish posts on the Team Blog.' },
        { id: 'photo', c: 'Memories', ic: '📸', n: 'Photographer', m: 'photos', t: [1, 10, 30, 100], u: 'photos', d: 'Add photos to the meeting galleries.' },
        { id: 'memory', c: 'Memories', ic: '🎽', n: 'Memory Keeper', m: 'mem', t: [1, 3, 6, 12], u: 'pieces', d: 'Add pieces to the Tsunami Memorabilia.' },
        { id: 'chat', c: 'Social', ic: '💬', n: 'Chatterbox', m: 'msgs', t: [10, 100, 500, 2000], u: 'messages', d: 'Write messages in the Lagoon.' },
        { id: 'conv', c: 'Social', ic: '↩️', n: 'Conversationalist', m: 'replies', t: [5, 25, 100, 300], u: 'replies', d: 'Reply to messages in the Lagoon.' },
        { id: 'conn', c: 'Social', ic: '📣', n: 'Connector', m: 'mentions', t: [5, 25, 100, 300], u: 'mentions', d: 'Mention other members with @ in the Lagoon.' },
        { id: 'comm', c: 'Social', ic: '💭', n: 'Commentator', m: 'comments', t: [3, 15, 50, 150], u: 'comments', d: 'Comment on posts in the Blog.' },
        { id: 'fav', c: 'Social', ic: '❤️', n: 'Crowd Favorite', m: 'likes', t: [5, 25, 100, 300], u: 'reactions', d: 'Receive reactions on your posts and comments.' },
        { id: 'party', c: 'Social', ic: '🎂', n: 'Party Animal', m: 'wishes', t: [1, 3, 6, 12], u: 'members greeted', d: 'Wish a member happy birthday on their birthday: a wave from the home page, or a message in the Lagoon.' },
        { id: 'wave', c: 'Social', ic: '🌊', n: 'Birthday Wave', m: 'waves', t: [1, 3, 6, 12], u: 'waves sent', d: 'Send a birthday wave from the home page to fill a member’s energy bar.' },
        { id: 'boosted', c: 'Memories', ic: '⚡', n: 'Birthday Boosted', m: 'boosted', t: [1, 2, 3, 5], u: 'Birthday Boosts', d: 'Your team filled your energy bar on your birthday.' },
        { id: 'streak', c: 'Rhythm', ic: '🔥', n: 'On Fire', m: 'streak', t: [3, 7, 14, 30], u: 'days in a row', d: 'Write in the Lagoon on consecutive days.' },
        { id: 'owl', c: 'Rhythm', ic: '🦉', n: 'Night Owl', m: 'night', t: [1, 10, 50, 150], u: 'night messages', d: 'Write in the Lagoon between midnight and 5 AM.' },
        { id: 'early', c: 'Rhythm', ic: '🌅', n: 'Early Bird', m: 'early', t: [1, 10, 50, 150], u: 'morning messages', d: 'Write in the Lagoon between 5 and 8 AM.' },
        { id: 'plan', c: 'Rhythm', ic: '📅', n: 'Planner', m: 'planner', t: [3, 10, 25, 60], u: 'days', d: 'Mark the days you are free in the meeting calendar.' },
        { id: 'set', c: 'Rhythm', ic: '🧩', n: 'All Set', m: 'profile', t: [3, 4, 5], u: 'of 5 steps', d: 'Complete your profile: call sign, birthday, city vote, free dates, first stamp.' },
        { id: 'allr', c: 'Rhythm', ic: '🎨', n: 'All-Rounder', m: 'kinds', t: [3, 4, 5], u: 'of 5 activities', d: 'Use the whole site: publish a post, add a photo, add a Memorabilia piece, write in the Lagoon and comment on the Blog.' },
        { id: 'ritual', c: 'Rhythm', ic: '🌅', n: 'Morning Ritual', m: 'boostRun', t: [3, 7, 30, 100], u: 'days in a row', d: 'Open the Daily Booster on the home page on consecutive days.' },
        { id: 'pfan', c: 'Social', ic: '😍', n: 'Photo Fan', m: 'pReact', t: [5, 25, 75, 200], u: 'reactions', d: 'React with emojis to photos and comments in the meeting galleries.' },
        { id: 'ptalk', c: 'Memories', ic: '🖼️', n: 'Gallery Talker', m: 'pComm', t: [3, 15, 40, 100], u: 'comments', d: 'Comment on photos in the meeting galleries.' },
        { id: 'pstar', c: 'Memories', ic: '🌟', n: 'Snapshot Star', m: 'pGot', t: [5, 25, 100, 300], u: 'reactions', d: 'Receive reactions on your gallery photos and comments.' },
        { id: 'phop', c: 'Journey', ic: '🗺️', n: 'Gallery Hopper', m: 'pHop', t: [2, 3], u: 'galleries', d: 'React or comment in the galleries of different Tsunami Meetings.' },
        { id: 'found', c: 'Special', ic: '🏴', n: 'Founder', m: 'founder', t: [1], u: '', secret: true, hint: 'Reserved for the ones who started it all.', d: 'One of the thirteen founders of the Tsunami Team.' },
        { id: 'lucky', c: 'Special', ic: '🍀', n: 'Lucky Number', m: 'lucky', t: [1], u: '', secret: true, hint: 'Some say the Lagoon rewards perfect timing…', d: 'You wrote in the Lagoon at exactly 13:13.' },
        { id: 'insom', c: 'Special', ic: '🌙', n: 'Insomniac', m: 'nightDays', t: [7], u: '', secret: true, hint: 'The Lagoon never sleeps… and neither do you, apparently.', d: 'You wrote in the Lagoon at night (midnight to 5 AM) on 7 different days.' },
        { id: 'marat', c: 'Special', ic: '🎙️', n: 'Marathon', m: 'maxDay', t: [50], u: '', secret: true, hint: 'Some days you just can’t stop talking.', d: 'You wrote 50 messages in the Lagoon in a single day.' },
        { id: 'thread', c: 'Special', ic: '🧵', n: 'Thread Starter', m: 'thread', t: [3], u: '', secret: true, hint: 'Say something that gets the whole team talking.', d: 'One of your Lagoon messages got replies from 3 different members.' },
        { id: 'roll', c: 'Special', ic: '📋', n: 'Roll Call', m: 'roll', t: [1], u: '', secret: true, hint: 'Nobody gets left out.', d: 'You mentioned every other member with @ in the Lagoon.' },
        { id: 'midn', c: 'Special', ic: '🎆', n: 'Midnight Wish', m: 'midn', t: [1], u: '', secret: true, hint: 'The first wish of the day is the best one.', d: 'You wished a member happy birthday in the first minutes of their birthday (00:00–00:15).' },
        { id: 'fpush', c: 'Special', ic: '🎯', n: 'Final Push', m: 'filler', t: [1], u: '', secret: true, hint: 'Some waves arrive exactly when they are needed.', d: 'Your wave was the one that unlocked a Birthday Boost.' },
        { id: 'fwave', c: 'Special', ic: '🥇', n: 'First Wave', m: 'firstWave', t: [1], u: '', secret: true, hint: 'Be the first to wish.', d: 'You sent the first wave on a member’s birthday.' },
        { id: 'fcrew', c: 'Special', ic: '🌐', n: 'Full Team', m: 'fullCrew', t: [1], u: '', secret: true, hint: 'When everyone shows up for you…', d: 'Every other member sent you a birthday wave.' },
        { id: 'salt', c: 'Special', ic: '🧓', n: 'Old Salt', m: 'salt', t: [1], u: '', secret: true, hint: 'Only time can earn this one.', d: 'You have been writing in the Lagoon for over 90 days, with at least 100 messages.' },
        { id: 'plat', c: 'Special', ic: '💠', n: 'Platinum Touch', m: 'plat', t: [1], u: '', secret: true, hint: 'Reach the very top of a badge.', d: 'You reached the Platinum level on at least one badge.' },
        { id: 'slam', c: 'Special', ic: '🧙', n: 'Grand Slam', m: 'slam', t: [5], u: '', secret: true, hint: 'Excellence, five times over.', d: 'You reached Gold or better on 5 different badges.' },
        { id: 'sage', c: 'Special', ic: '🏛️', n: 'Keeper of Wisdom', m: 'boostAll', t: [1], u: '', secret: true, hint: 'Every day brings a different voice… can you hear them all?', d: 'You read every single quote of the Daily Booster.' },
        { id: 'pal', c: 'Special', ic: '🎭', n: 'Full Palette', m: 'pPal', t: [6], u: '', secret: true, hint: 'Every feeling has its emoji… have you tried them all?', d: 'You used all six reactions: 👍 ❤️ 😂 😮 😢 😡.' },
        { id: 'mag', c: 'Special', ic: '🧲', n: 'Photo Magnet', m: 'pMag', t: [8], u: '', secret: true, hint: 'One shot that nobody could resist.', d: 'One of your gallery photos received reactions from 8 different members.' },
        { id: 'top', c: 'Special', ic: '🏆', n: 'Completionist', m: 'badges', t: [5, 10, 20, 30], u: 'badges unlocked', d: 'Unlock many different badges.' }
      ];
      const LEVELS = [
        { xp: 0, ic: '🐚', n: 'Rookie' }, { xp: 40, ic: '🏄', n: 'Surfer' }, { xp: 150, ic: '🌊', n: 'Tide Master' },
        { xp: 400, ic: '⛈️', n: 'Storm Chaser' }, { xp: 900, ic: '🌪️', n: 'Tsunami Legend' }
      ];
      const lvlOf = (b, M) => b.t.filter(x => M[b.m] >= x).length;
      const ptsOf = (b, l) => { let p = 0; for (let i = 0; i < l; i++) p += b.t.length === 1 ? (b.secret ? 50 : 30) : TP[i + (4 - b.t.length)]; return p; };
      function nickOf(e) { return (nicks.find(x => x.email === e) || {}).nickname || null; }

      function metricsFor(e, D) {
        const M = {}, nm = nickOf(e);
        const st = D.att.filter(x => x.email === e);
        M.stamps = st.length;
        M.fullT = MEETINGS.length && MEETINGS.every(k => st.some(x => x.meeting === k.key)) ? 1 : 0;
        const myP = D.posts.filter(p => p.email === e), myC = D.comments.filter(c => c.email === e);
        M.posts = myP.length; M.comments = myC.length;
        const ids = new Set(myP.map(p => 'p' + p.id).concat(myC.map(c => 'c' + c.id)));
        M.likes = D.reactions.filter(r => r.email !== e && ids.has(r.target)).length;
        const ph = D.photos.filter(p => p.email === e);
        M.photos = ph.length;
        const me = D.mem.filter(x => x.email === e);
        M.mem = me.length;
        const ccs = new Set();
        ph.forEach(p => { const k = MEETINGS.find(x => x.key === p.meeting); if (k && k.cc) ccs.add(k.cc); });
        me.forEach(x => { const k = MEETINGS.find(y => y.key === x.meeting_key); if (k && k.cc) ccs.add(k.cc); });
        M.countries = ccs.size;
        const cm = D.chat.filter(x => x.email === e);
        M.msgs = cm.length; M.replies = cm.filter(x => x.reply_to).length;
        const re = mentionRe();
        M.mentions = re ? cm.filter(x => { const f = String(x.body).match(re); return f && f.some(s => s.slice(1).toLowerCase() !== (nm || '').toLowerCase()); }).length : 0;
        M.night = 0; M.early = 0; M.lucky = 0; M.midn = 0;
        const days = new Set(), wish = new Set(), nightD = new Set(), perDay = {}, ment = new Set();
        cm.forEach(x => {
          const d = new Date(x.created_at), h = d.getHours(), dk = d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate();
          if (h < 5) { M.night++; nightD.add(dk); } else if (h < 8) M.early++;
          if (h === 13 && d.getMinutes() === 13) M.lucky = 1;
          days.add(dk); perDay[dk] = (perDay[dk] || 0) + 1;
          if (re) { const f = String(x.body).match(re); if (f) f.forEach(sx => { const n = sx.slice(1).toLowerCase(); if (n !== (nm || '').toLowerCase()) ment.add(n); }); }
          if (GREET.test(x.body)) D.bd.forEach(r => {
            if (r.email !== e && r.day === d.getDate() && r.month === d.getMonth() + 1) { wish.add(r.email); if (h === 0 && d.getMinutes() < 15) M.midn = 1; }
          });
        });
        M.nightDays = nightD.size;
        M.maxDay = Math.max.apply(null, [0].concat(Object.values(perDay)));
        const others = Array.from(new Set(nicks.filter(x => x.email !== e).map(x => String(x.nickname).toLowerCase())));
        M.roll = others.length >= 5 && others.every(n => ment.has(n)) ? 1 : 0;
        const mine = new Set(cm.map(x => x.id)), rep = {};
        D.chat.forEach(x => { if (x.reply_to && mine.has(x.reply_to) && x.email !== e) (rep[x.reply_to] = rep[x.reply_to] || new Set()).add(x.email); });
        M.thread = Math.max.apply(null, [0].concat(Object.values(rep).map(v => v.size)));
        const tms = cm.map(x => new Date(x.created_at).getTime());
        M.salt = cm.length >= 100 && tms.length && (Math.max.apply(null, tms) - Math.min.apply(null, tms)) / 864e5 >= 90 ? 1 : 0;
        // Birthday waves (home page): the team's own way of wishing, no matter the language.
        const W = D.waves || [], boostNeed = o => Math.max(1, Math.ceil(o * 2 / 3)), othersW = Math.max(0, nicks.length - 1);
        const myW = W.filter(x => x.email === e);
        M.waves = myW.length;
        myW.forEach(x => { wish.add(x.bday_email); const t = new Date(x.created_at); if (t.getHours() === 0 && t.getMinutes() < 15) M.midn = 1; });
        const byB = {}; W.forEach(x => { (byB[x.bday_email + '|' + x.year] = byB[x.bday_email + '|' + x.year] || []).push(x); });
        M.boosted = 0; M.fullCrew = 0; M.filler = 0; M.firstWave = 0;
        Object.keys(byB).forEach(k => {
          const list = byB[k].slice().sort((a, b) => String(a.created_at).localeCompare(String(b.created_at))), who = k.split('|')[0], nd = boostNeed(othersW);
          if (who === e && list.length >= nd) M.boosted++;
          if (who === e && othersW > 0 && list.length >= othersW) M.fullCrew = 1;
          if (list[nd - 1] && list[nd - 1].email === e) M.filler = 1;
          if (list[0] && list[0].email === e) M.firstWave = 1;
        });
        M.wishes = wish.size;
        const ts = Array.from(days).map(k => { const p = k.split('-'); return new Date(+p[0], +p[1], +p[2]).getTime(); }).sort((a, b) => a - b);
        let best = 0, run = 0;
        ts.forEach((t, i) => { run = i && Math.round((t - ts[i - 1]) / 864e5) === 1 ? run + 1 : 1; if (run > best) best = run; });
        M.streak = best;
        M.planner = D.days.filter(x => x.email === e).length;
        M.profile = 1 + (D.bd.some(x => x.email === e) ? 1 : 0) + (D.votes.some(x => x.email === e) ? 1 : 0) + (M.planner ? 1 : 0) + (M.stamps ? 1 : 0);
        M.founder = FOUNDERS.indexOf(nm) > -1 ? 1 : 0;
        const bo = (D.boost || []).filter(x => x.email === e);
        const bd2 = Array.from(new Set(bo.map(x => +x.day))).sort((a, b) => a - b);
        let br = 0, bb = 0; bd2.forEach((d, i) => { br = i && d - bd2[i - 1] === 1 ? br + 1 : 1; if (br > bb) bb = br; });
        M.boostRun = bb;
        const allQ = (window.TT_BOOST && window.TT_BOOST.hashes) || [], seenQ = new Set(bo.map(x => x.q));
        M.boostAll = allQ.length && allQ.every(h => seenQ.has(h)) ? 1 : 0;
        const PR = D.pr || [], PC = D.pc || [], myPc = PC.filter(c => c.email === e), given = PR.filter(r => r.email === e);
        const myPh = new Set(ph.map(p => String(p.id))), myT = new Set(ph.map(p => 'p' + p.id).concat(myPc.map(c => 'c' + c.id)));
        M.pReact = given.length; M.pComm = myPc.length;
        M.pGot = PR.filter(r => r.email !== e && myT.has(r.target)).length;
        M.pPal = new Set(given.map(r => r.emoji).filter(x => PALETTE.indexOf(x) > -1)).size;
        const perP = {}; PR.forEach(r => { if (r.email !== e && r.target.charAt(0) === 'p' && myPh.has(r.target.slice(1))) perP[r.target] = (perP[r.target] || 0) + 1; });
        M.pMag = Math.max.apply(null, [0].concat(Object.values(perP)));
        const phMeet = {}, cMeet = {}, gal = new Set();
        D.photos.forEach(p => { phMeet[String(p.id)] = p.meeting; }); PC.forEach(c => { cMeet[String(c.id)] = phMeet[String(c.photo_id)]; });
        given.forEach(r => { const mk = r.target.charAt(0) === 'p' ? phMeet[r.target.slice(1)] : cMeet[r.target.slice(1)]; if (mk) gal.add(mk); });
        myPc.forEach(c => { const mk = phMeet[String(c.photo_id)]; if (mk) gal.add(mk); });
        M.pHop = gal.size;
        M.kinds = (M.posts ? 1 : 0) + (M.photos ? 1 : 0) + (M.mem ? 1 : 0) + (M.msgs ? 1 : 0) + (M.comments ? 1 : 0);
        const META = ['top', 'plat', 'slam'];
        M.plat = BADGES.filter(b => META.indexOf(b.id) < 0 && b.t.length > 1 && lvlOf(b, M) === b.t.length).length;
        M.slam = BADGES.filter(b => META.indexOf(b.id) < 0 && b.t.length > 1 && lvlOf(b, M) >= b.t.length - 1).length;
        M.badges = BADGES.filter(b => b.id !== 'top' && lvlOf(b, M) > 0).length;
        return M;
      }
      // What a passport shows: level, XP and badges (secret ones stay secret on other members' passports).
      function passOf(e, M) {
        const sc = scoreOf(M), got = BADGES.map(b => ({ b: b, l: lvlOf(b, M) })).filter(x => x.l > 0 && x.b.id !== 'top');
        return { email: e, nick: nickOf(e), att: DATA.att, bd: DATA.bd.find(x => x.email === e) || null, xp: sc.xp, level: LEVELS[sc.L], next: LEVELS[sc.L + 1] || null,
          badges: got.map(x => x.b.secret && e !== email ? { ic: '🔒', n: 'Secret badge', tier: '' } : { ic: x.b.ic, n: x.b.n, tier: x.b.t.length > 1 ? TI[x.l - 1 + (4 - x.b.t.length)] : '' }) };
      }
      function scoreOf(M) {
        let xp = 0; BADGES.forEach(b => { xp += ptsOf(b, lvlOf(b, M)); });
        let L = 0; LEVELS.forEach((l, i) => { if (xp >= l.xp) L = i; });
        return { xp: xp, L: L };
      }

      function celebrate(ups) {
        const box = document.createElement('div'); box.id = 'bdg-pop';
        const nm = nickOf(email) || '';
        box.innerHTML = '<div class="pop"><div class="pop-t">🎉 Congratulations' + (nm ? ', ' + esc(nm) : '') + '!</div><div class="pop-s">' + (ups.length > 1 ? 'You unlocked ' + ups.length + ' new badges' : 'You unlocked a new badge') + '</div>' + ups.map(u => {
          const b = u.b, tiered = b.t.length > 1, off = 4 - b.t.length, xp = ptsOf(b, u.l) - ptsOf(b, u.l - 1), v = (myM && myM[b.m]) || 0;
          const why = esc(b.d) + (tiered ? '<br>🎯 ' + esc(b.u.charAt(0).toUpperCase() + b.u.slice(1)) + ': <b>' + b.t[u.l - 1] + '</b>' : '');
          return '<div class="pop-b"><span>' + b.ic + '</span><b>' + esc(b.n) + '</b><small>' + (tiered ? TI[u.l - 1 + off] + ' ' + TN[u.l - 1 + off] : (b.secret ? '🤫 Secret badge' : 'Unlocked')) + ' · +' + xp + ' XP</small><p class="pop-w">' + why + '</p></div>';
        }).join('') + '<button type="button">Nice!</button></div>';
        for (let i = 0; i < 26; i++) { const s = document.createElement('i'); s.className = 'cf'; s.textContent = ['🎉', '✨', '🌊', '⭐'][i % 4]; s.style.left = Math.random() * 100 + '%'; s.style.animationDelay = (Math.random() * 1.2) + 's'; s.style.fontSize = (14 + Math.random() * 14) + 'px'; box.appendChild(s); }
        box.addEventListener('click', function (e) { if (e.target.tagName === 'BUTTON' || e.target === box) box.remove(); });
        document.body.appendChild(box);
      }

      function birthdayPop(name) {
        if (document.getElementById('bb-pop')) return; // the Birthday Boost already greets
        const box = document.createElement('div'); box.id = 'bdg-pop';
        box.innerHTML = '<div class="pop"><div class="pop-b"><span>🎂</span></div><div class="pop-t">Happy Birthday, ' + esc(name || 'friend') + '!</div><p class="pop-w">The whole Tsunami Team wishes you a day full of waves, friends and good vibes. 🌊🥳<br>Your team is sending you their waves: when your energy bar on the home page is full your Birthday Boost unlocks, and at 21:00 it opens anyway ⚡</p><button type="button">Thank you! 🎉</button></div>';
        for (let i = 0; i < 40; i++) { const s = document.createElement('i'); s.className = 'cf'; s.textContent = ['🎂', '🎉', '🎈', '🥳', '✨', '🎁'][i % 6]; s.style.left = Math.random() * 100 + '%'; s.style.animationDelay = (Math.random() * 1.8) + 's'; s.style.fontSize = (16 + Math.random() * 16) + 'px'; box.appendChild(s); }
        box.addEventListener('click', function (e) { if (e.target.tagName === 'BUTTON' || e.target === box) box.remove(); });
        document.body.appendChild(box);
      }

      function renderBadges() {
        const M = myM, sc = scoreOf(M), lv = LEVELS[sc.L], nx = LEVELS[sc.L + 1];
        const pct = nx ? Math.round((sc.xp - lv.xp) / (nx.xp - lv.xp) * 100) : 100;
        let h = '<div class="lvl"><div class="lvl-top"><span class="lvl-ic">' + lv.ic + '</span><div><b>' + lv.n + '</b><small>' + sc.xp + ' XP</small></div></div><div class="bar"><i style="width:' + pct + '%"></i></div><small>' + (nx ? (nx.xp - sc.xp) + ' XP to ' + nx.ic + ' ' + nx.n : 'Top level reached. You are a legend!') + '</small><small class="lvl-hint">Every badge level gives XP: 🥉 10 · 🥈 25 · 🥇 50 · 💎 100. Tap a badge for details.</small></div>';
        CATS.forEach(function (cat) {
          h += '<h4 class="bcat">' + cat + '</h4><div class="bgrid">';
          BADGES.filter(b => b.c === cat).forEach(function (b) {
            const l = lvlOf(b, M), v = M[b.m] || 0, tot = b.t.length, off = 4 - tot, got = l > 0, nextT = b.t[l];
            const hide = b.secret && !got;
            const medals = tot === 1 ? '' : '<div class="med">' + b.t.map((x, i) => '<span class="' + (i < l ? 'on' : '') + '">' + TI[i + off] + '</span>').join('') + '</div>';
            const prog = hide ? '<small>Secret</small>' : (nextT ? '<div class="bar"><i style="width:' + Math.min(100, Math.round(v / nextT * 100)) + '%"></i></div><small>' + Math.min(v, nextT) + '/' + nextT + ' ' + b.u + '</small>' : '<small>✅ Maxed out</small>');
            let det = hide ? esc(b.hint) : '<p>' + esc(b.d) + '</p>' + (tot === 1 ? '' : '<ul>' + b.t.map((x, i) => '<li class="' + (i < l ? 'ok' : '') + '">' + TI[i + off] + ' ' + TN[i + off] + ': ' + x + ' ' + esc(b.u) + (i < l ? ' ✓' : '') + '</li>').join('') + '</ul>');
            h += '<div class="bcard' + (got ? ' got' : ' lock') + '" data-b="' + b.id + '"><div class="bic">' + (hide ? '❓' : b.ic) + '</div><b>' + (hide ? 'Secret badge' : esc(b.n)) + '</b>' + medals + prog + '<div class="bdet">' + det + '</div></div>';
          });
          h += '</div>';
        });
        $('badges').innerHTML = h;
        if (!$('badges').dataset.bound) {
          $('badges').dataset.bound = '1';
          $('badges').addEventListener('click', function (e) { const c = e.target.closest('.bcard'); if (c) c.classList.toggle('open'); });
        }
      }

      const CREWM = {}, CREWOPEN = {};
      function crewDetail(e) {
        const M = CREWM[e]; if (!M) return '';
        const got = BADGES.map(b => ({ b: b, l: lvlOf(b, M) })).filter(x => x.l > 0);
        if (!got.length) return '<p class="vote-hint" style="margin:0">No badges yet.</p>';
        let tot = 0;
        const items = got.map(x => {
          const xp = ptsOf(x.b, x.l); tot += xp;
          const nm = x.b.secret ? '🔒 Secret badge' : x.b.ic + ' ' + esc(x.b.n) + (x.b.t.length > 1 ? ' ' + TI[x.l - 1 + (4 - x.b.t.length)] : '');
          return { xp: xp, h: '<div class="cd-r"><span>' + nm + '</span><b>+' + xp + '</b></div>' };
        }).sort((a, b) => b.xp - a.xp);
        return items.map(i => i.h).join('') + '<div class="cd-r cd-t"><span>Total</span><b>' + tot + ' XP</b></div>';
      }
      function crewToggle(li) {
        const e = li.dataset.e, nx = li.nextElementSibling;
        if (nx && nx.classList.contains('cd')) { nx.remove(); delete CREWOPEN[e]; return; }
        const d = document.createElement('li'); d.className = 'cd'; d.innerHTML = crewDetail(e);
        li.parentNode.insertBefore(d, li.nextSibling); CREWOPEN[e] = 1;
      }
      function renderCrew() {
        const emails = Array.from(new Set(nicks.map(x => x.email)));
        const rows = emails.map(e => { const M = metricsFor(e, DATA), s = scoreOf(M); CREWM[e] = M; return { e: e, nick: nickOf(e) || 'A member', xp: s.xp, L: s.L, st: M.stamps, b: M.badges }; }).sort((a, b) => b.xp - a.xp || b.st - a.st);
        TT.set('levels', rows.map(r => ({ e: r.e, xp: r.xp, ic: LEVELS[r.L].ic, n: LEVELS[r.L].n })));
        TT.set('team', rows.map(r => passOf(r.e, CREWM[r.e])));
        $('crew').innerHTML = rows.length ? rows.map((r, i) => '<li class="cl" data-e="' + esc(r.e) + '" tabindex="0"><span>' + (i + 1) + '. ' + LEVELS[r.L].ic + ' ' + esc(r.nick) + (r.e === email ? ' (you)' : '') + ' <small style="color:var(--grey)">' + LEVELS[r.L].n + '</small></span><b>' + r.xp + ' XP ▾</b></li>').join('') : '<li>No members yet.</li>';
        Object.keys(CREWOPEN).forEach(e => { const li = Array.from($('crew').children).find(x => x.dataset && x.dataset.e === e); if (li) { delete CREWOPEN[e]; crewToggle(li); } });
        if (!$('crew').dataset.b) {
          $('crew').dataset.b = 1;
          $('crew').addEventListener('click', ev => { const li = ev.target.closest('li.cl'); if (li) crewToggle(li); });
          $('crew').addEventListener('keydown', ev => { if (ev.key === 'Enter') { const li = ev.target.closest('li.cl'); if (li) crewToggle(li); } });
        }
      }
      /* ---------------- BIRTHDAYS ---------------- */
      window.ttBdays = function () { return bdayInit(); };
      async function bdayInit() {
        const rows = (await get('birthdays?select=*')) || [];
        const mine = rows.find(r => r.email === email);
        const now = new Date(); now.setHours(0, 0, 0, 0);
        const out = [];
        if (mine && email && mine.day === now.getDate() && mine.month === now.getMonth() + 1) {
          const k = 'tt_bdpop_' + email, yr = String(now.getFullYear()); let seenY = null;
          try { seenY = localStorage.getItem(k); } catch (e) {}
          if (seenY !== yr) { try { localStorage.setItem(k, yr); } catch (e) {} setTimeout(function () { birthdayPop(nickOf(email)); }, 1500); }
        }
        const nameOf = r => (nicks.find(x => x.email === r.email) || {}).nickname || r.nickname || 'A member';
        rows.forEach(r => {
          let d = new Date(now.getFullYear(), r.month - 1, r.day);
          if (d < now) d = new Date(now.getFullYear() + 1, r.month - 1, r.day);
          const diff = Math.round((d - now) / 864e5);
          if (diff <= 7) out.push({ diff: diff, who: nameOf(r), me: r.email === email });
        });
        out.sort((a, b) => a.diff - b.diff);
        const el = $('bday');
        if (!out.length) { el.classList.remove('show'); return; }
        el.textContent = out.slice(0, 3).map(o => o.diff === 0 ? (o.me ? '🎂 Happy birthday, ' + o.who + '! Your team is filling your energy bar ⚡' : '🎂 Today is ' + o.who + '’s birthday! Send your wave from the home page 🌊') : '🎈 ' + o.who + '’s birthday in ' + o.diff + (o.diff === 1 ? ' day' : ' days')).join('  ·  ');
        el.classList.add('show');
      }

      /* ---------------- NOTIFICATIONS ---------------- */
      async function bellInit() {
        const btn = $('bell'), panel = $('bell-panel');
        if (!btn || !email) return;
        const KEY = 'tt_seen_' + email, CK = 'tt_chat_seen_' + email;
        let seen = 0; try { seen = +localStorage.getItem(KEY) || 0; } catch (e) {}
        let chatSeen = 0; try { chatSeen = +localStorage.getItem(CK) || 0; } catch (e) {}
        let topChat = 0, lastBadge = -1;
        const LAG = '#tabbar [data-v=lagoon], .nav-drop a[href="#lagoon"]';
        let bdT = [], bdTk = '';
        TT.when('bdayToday', function (v) { const k = JSON.stringify(v || []); bdT = v || []; if (k !== bdTk) { bdTk = k; check(); } });

        function badge(sel, n, hot) {
          document.querySelectorAll(sel).forEach(function (el) {
            let b = el.querySelector(':scope > .nbadge');
            if (!n) { if (b) b.remove(); return; }
            if (!b) { b = document.createElement('i'); b.className = 'nbadge'; el.appendChild(b); }
            b.textContent = n > 9 ? '9+' : n; b.classList.toggle('hot', !!hot);
          });
        }
        function markChatSeen() {
          if (!topChat) return;
          chatSeen = topChat; try { localStorage.setItem(CK, chatSeen); } catch (e) {}
          badge(LAG, 0);
        }
        const lag = document.getElementById('lagoon');
        if (lag && 'IntersectionObserver' in window) {
          new IntersectionObserver(function (en) { if (en[0].isIntersecting) markChatSeen(); }, { threshold: 0.35 }).observe(lag);
        }

        async function check() {
          const e = encodeURIComponent(email);
          const [cs, ps, chat, myVote, myDays, myBd, ups, lastPosts] = await Promise.all([
            get('comments?select=id,post_id,parent_id,email,author,body,created_at&order=created_at.desc&limit=300'),
            get('posts?select=id,title,email&email=eq.' + e),
            get('chat_messages?select=*&order=id.desc&limit=100'),
            get('meeting_votes?select=email&email=eq.' + e + '&limit=1'),
            get('meeting_days?select=email&email=eq.' + e + '&limit=1'),
            get('birthdays?select=email&email=eq.' + e + '&limit=1'),
            get('site_updates?select=title,body,url,created_at&order=id.desc&limit=3'),
            get('posts?select=id,title,body,email,author,created_at&order=created_at.desc&limit=50')
          ]);
          // What's new on the site: the latest updates, highlighted until the bell is opened.
          const news = (ups || []).filter(u => Date.now() - new Date(u.created_at).getTime() < 30 * 864e5).map(u => ({ t: new Date(u.created_at).getTime(), u: u }));
          const items = [];
          if (cs) {
            const myC = new Set(cs.filter(c => c.email === email).map(c => c.id)), myP = new Set((ps || []).map(p => p.id));
            const title = {}; (ps || []).forEach(p => title[p.id] = p.title);
            cs.filter(c => c.email !== email && ((c.parent_id && myC.has(c.parent_id)) || (!c.parent_id && myP.has(c.post_id)))).slice(0, 15).forEach(c =>
              items.push({ cid: c.id, t: new Date(c.created_at).getTime(), href: '#blog', who: c.author, txt: c.parent_id ? 'replied to your comment' : 'commented on your post “' + (title[c.post_id] || '') + '”', at: c.created_at }));
          }
          // @mentions in the Blog (posts and comments), unless already listed as a reply.
          const bre = nick ? new RegExp('@' + nick.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![\\p{L}\\p{N}])', 'iu') : null;
          if (bre) {
            (cs || []).filter(c => c.email !== email && bre.test(c.body || '') && !items.some(i => i.cid === c.id)).slice(0, 10).forEach(c =>
              items.push({ t: new Date(c.created_at).getTime(), href: '#blog', who: c.author, txt: 'mentioned you in a comment', at: c.created_at }));
            (lastPosts || []).filter(p => p.email !== email && bre.test((p.title || '') + ' ' + (p.body || ''))).slice(0, 10).forEach(p =>
              items.push({ t: new Date(p.created_at).getTime(), href: '#blog', who: p.author, txt: 'mentioned you in the post “' + (p.title || '') + '”', at: p.created_at }));
          }
          let chatNew = 0, chatHot = 0;
          if (chat && chat.length) {
            topChat = Math.max.apply(null, chat.map(m => m.id));
            const byId = {}; chat.forEach(m => byId[m.id] = m);
            const mre = nick ? new RegExp('@' + nick.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![\\p{L}\\p{N}])', 'iu') : null;
            chat.filter(m => m.email !== email).forEach(function (m) {
              const mention = mre && mre.test(m.body), reply = m.reply_to && byId[m.reply_to] && byId[m.reply_to].email === email;
              if (m.id > chatSeen) { chatNew++; if (mention || reply) chatHot++; }
              if (mention || reply) items.push({ t: new Date(m.created_at).getTime(), href: '#lagoon', who: m.nickname, txt: mention ? 'mentioned you in the Lagoon' : 'replied to you in the Lagoon', at: m.created_at });
            });
          }
          // New badges: one line in the bell, however many were unlocked.
          let bnews = []; try { bnews = (JSON.parse(localStorage.getItem('tt_bnews_' + email)) || []).filter(n => n.t > seen); } catch (x) {}
          items.sort((x, y) => y.t - x.t);
          const list = items.slice(0, 10);
          const todos = [];
          if (myVote !== null && !myVote.length) todos.push({ href: '#meetings', ic: '🗳', txt: 'Vote the city of the next Tsunami Meeting' });
          if (myDays !== null && !myDays.length) todos.push({ href: '#meetings', ic: '📅', txt: 'Pick the dates you can attend' });
          if (myBd !== null && !myBd.length) todos.push({ href: '#passport', ic: '🎂', txt: 'Add your birthday in the Passport' });
          bdT.filter(b => b.email !== email && !b.mine).forEach(b => todos.unshift({ href: '#home', ic: '🌊', txt: 'Send your birthday wave to ' + (nickOf(b.email) || 'a member') }));
          const unread = list.filter(c => c.t > seen).length + (bnews.length ? 1 : 0) + news.filter(n => n.t > seen).length;
          const total = unread + todos.length;
          btn.classList.toggle('has', total > 0); btn.querySelector('i').textContent = total > 9 ? '9+' : total;
          let html = '';
          if (news.length) html += '<h4>What’s new</h4>' + news.map(n => '<a href="' + esc((n.u.url || '/#home').replace(/^\//, '')) + '" class="' + (n.t > seen ? 'new' : '') + '">🆕 <b>' + esc(n.u.title) + '</b><br><small>' + esc(n.u.body) + '</small></a>').join('');
          if (todos.length) html += '<h4>To do</h4>' + todos.map(t => '<a href="' + t.href + '">' + t.ic + ' ' + esc(t.txt) + '</a>').join('');
          if (chatNew) html += '<h4>Lagoon</h4><a href="#lagoon" class="' + (chatHot ? 'new' : '') + '">💬 ' + chatNew + ' new message' + (chatNew > 1 ? 's' : '') + (chatHot ? ' · ' + chatHot + ' for you' : '') + '</a>';
          if (bnews.length) html += '<h4>Badges</h4><a href="#passport" class="new">🏅 <b>' + bnews.length + ' new badge' + (bnews.length > 1 ? 's' : '') + '</b><br><small>' + esc(bnews.map(n => n.txt).join(' · ')) + '</small></a>';
          if (list.length) html += '<h4>Mentions &amp; replies</h4>' + list.map(c => '<a href="' + c.href + '" class="' + (c.t > seen ? 'new' : '') + '"><b>' + esc(c.who) + '</b> ' + esc(c.txt) + '<br><small>' + new Date(c.at).toLocaleDateString('en-GB') + '</small></a>').join('');
          const ps2 = window.ttPush ? window.ttPush.state() : 'checking';
          const prow = ps2 === 'on' ? '<a href="#" data-push="1">🔔 Push notifications: <b>ON</b> <small>(tap to turn off)</small></a>'
            : ps2 === 'off' ? '<a href="#" data-push="1">🔕 <b>Turn on push notifications</b><br><small>Get an alert when someone mentions or replies to you</small></a>'
            : ps2 === 'install' ? '<p class="pnote">📲 For push notifications: add this site to your Home Screen (Share → Add to Home Screen) and open it from there.</p>'
            : ps2 === 'denied' ? '<p class="pnote">Push notifications are blocked. Allow them in your phone settings for this site.</p>' : '';
          const ls = window.ttLock ? window.ttLock.state() : 'unsupported';
          const lrow = ls === 'on' ? '<a href="#" data-lock="1">🔒 Face ID lock: <b>ON</b> <small>(tap to turn off)</small></a>'
            : ls === 'off' ? '<a href="#" data-lock="1">🔓 <b>Turn on Face ID lock</b><br><small>Ask Face ID whenever the app is opened</small></a>' : '';
          panel.innerHTML = (html || '<p>All caught up ✅ Nothing to do right now.</p>') + prow + lrow + '<a href="#" data-favs="1">❤️ <b>Favorite quotes</b><br><small>Your saved Daily Booster quotes</small></a>' + '<a href="#" data-guide="1">📖 <b>Site guide</b><br><small>What’s where and what to do</small></a>';
          // Only the Lagoon shows a number on the menu (new messages); everything else lives in the bell.
          badge(LAG, chatNew, chatHot);
          const dot = total + chatNew;
          document.title = (dot ? '(' + dot + ') ' : '') + document.title.replace(/^\(\d+\)\s*/, '');
          try { if (navigator.setAppBadge) { dot ? navigator.setAppBadge(dot) : navigator.clearAppBadge(); } } catch (x) {}
          if (lag && lag.offsetParent !== null) { const r = lag.getBoundingClientRect(); if (r.top < innerHeight * 0.65 && r.bottom > innerHeight * 0.35) markChatSeen(); }
        }
        btn.onclick = function (ev) {
          ev.stopPropagation(); panel.classList.toggle('open'); if (panel.classList.contains('open')) check();
          if (!panel.classList.contains('open')) { try { localStorage.setItem(KEY, Date.now()); seen = Date.now(); } catch (x) {} check(); }
        };
        document.addEventListener('click', function (ev) { if (!ev.target.closest('.bell-wrap') && panel.classList.contains('open')) { panel.classList.remove('open'); try { localStorage.setItem(KEY, Date.now()); seen = Date.now(); } catch (x) {} check(); } });
        panel.addEventListener('click', function (ev) { const lb = ev.target.closest('[data-lock]'); if (lb) { ev.preventDefault(); ev.stopPropagation(); if (window.ttLock) window.ttLock.toggle().then(check); return; } const pb = ev.target.closest('[data-push]'); if (pb) { ev.preventDefault(); ev.stopPropagation(); if (window.ttPush) window.ttPush.toggle().then(check); return; } panel.classList.remove('open'); try { localStorage.setItem(KEY, Date.now()); seen = Date.now(); } catch (x) {} });
        document.addEventListener('visibilitychange', function () { if (!document.hidden) check(); });
        check(); setInterval(function () { if (!document.hidden) check(); }, 30000);
      }

      init();
    })();
