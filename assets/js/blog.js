    (function () {
      const BASE = 'https://dykofnyhwusghfowfxbi.supabase.co';
      const JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5a29mbnlod3VzZ2hmb3dmeGJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwNjUwOTQsImV4cCI6MjEwNzY0MTA5NH0.wLS75UXlm2evHg1mlvjvrlJASDP9KRaE_b8fhnJ8htI';
      const H = { apikey: JWT, Authorization: 'Bearer ' + JWT };
      const HJ = Object.assign({ 'Content-Type': 'application/json' }, H);
      const R = BASE + '/rest/v1/';
      const $ = id => document.getElementById(id);
      const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
      let nick = null, email = null, posts = [], comments = [], reacts = [], drafts = {}, open = {}, replyTo = null, broken = false, limit = 30;
      // Reactions: the same emojis as the meeting galleries, one per member on each post or comment.
      const PAL = ['👍', '❤️', '😂', '😮', '😢', '😡'];
      let names = [], nk = [], ptags = [], tagPost = null;
      const deepPost = +(new URLSearchParams(location.search).get('post') || 0);
      const nameOfE = e => (nk.find(x => x.email === e) || {}).nickname || 'A member';
      TT.nicks().then(n => { nk = n || []; names = Array.from(new Set((n || []).map(x => x.nickname).filter(Boolean))).sort((a, b) => b.length - a.length); render(); });
      const reEsc = t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Text with @Call sign mentions highlighted (only real call signs).
      function fmt(t) {
        let h = esc(t);
        if (names.length) h = h.replace(new RegExp('@(' + names.map(n => reEsc(esc(n))).join('|') + ')(?![\\p{L}\\p{N}])', 'giu'), '<span class="mention">@$1</span>');
        return h;
      }


      fetch('/cdn-cgi/access/get-identity', { credentials: 'same-origin' })
        .then(r => r.ok ? r.json() : {})
        .then(j => { if (j && j.email) { email = j.email.toLowerCase(); loadNick(); load(); } })
        .catch(function () {});

      function who() {
        if (email) return email;
        try { email = localStorage.getItem('tt_email') || ''; } catch (e) {}
        if (!email) email = (window.prompt('Your email:') || '').trim().toLowerCase();
        try { if (email) localStorage.setItem('tt_email', email); } catch (e) {}
        if (email && !nick) loadNick();
        return email;
      }

      function myName() {
        if (!nick) toast('Choose your call sign first.');
        return nick;
      }

      async function loadNick() {
        try {
          const r = await fetch(R + 'nicknames?select=nickname&email=eq.' + encodeURIComponent(email), { headers: H });
          const j = r.ok ? await r.json() : [];
          nick = j.length ? j[0].nickname : null;
        } catch (e) { nick = null; }
        renderNick();
      }

      function renderNick() {
        $('blog-nick').innerHTML = nick
          ? 'Posting as <strong>' + esc(nick) + '</strong>'
          : '<strong>Choose your call sign</strong> to post and comment.<br><button type="button" id="nick-save">Choose now</button>';
      }

      $('blog-nick').addEventListener('click', function (e) {
        if (e.target.id === 'nick-save' && window.openCallsignGate) window.openCallsignGate();
      });

      function shrink(file) {
        return new Promise(function (ok, fail) {
          const img = new Image();
          img.onload = function () {
            const k = Math.min(1, 1280 / Math.max(img.width, img.height));
            const c = document.createElement('canvas');
            c.width = Math.round(img.width * k);
            c.height = Math.round(img.height * k);
            c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
            c.toBlob(b => b ? ok(b) : fail(), 'image/jpeg', 0.8);
          };
          img.onerror = fail;
          img.src = URL.createObjectURL(file);
        });
      }

      function toast(t) {
        const e = $('toast');
        e.textContent = t;
        e.classList.add('show');
        clearTimeout(toast.t);
        toast.t = setTimeout(() => e.classList.remove('show'), 4500);
      }

      async function get(p) {
        try { const r = await fetch(R + p, { headers: H }); return r.ok ? await r.json() : null; } catch (e) { return null; }
      }

      async function load() {
        const a = await Promise.all([
          get('posts?select=*&order=created_at.desc&limit=' + limit),
          get('comments?select=*&order=created_at.asc'),
          get('reactions?select=*'),
          get('post_tags?select=post_id,email,tagged_by')
        ]);
        posts = a[0] || []; comments = a[1] || []; reacts = a[2] || []; ptags = a[3] || [];
        broken = a[1] === null || a[2] === null;
        render();
        // Opened from a notification (?post=…#blog): bring that post into view once.
        if (deepPost && !load.done) {
          load.done = true;
          setTimeout(function () { const el = document.querySelector('#blog-list [data-aid="p' + deepPost + '"]'); if (el) { el.scrollIntoView({ block: 'start', behavior: 'smooth' }); el.classList.add('b-flash'); } }, 400);
        }
      }

      const emo = x => x.emoji || (x.value > 0 ? '👍' : null);
      const cnt = (t, e) => reacts.filter(x => x.target === t && emo(x) === e).length;
      const mine = t => reacts.find(x => x.target === t && x.email === email);
      const day = d => new Date(d).toLocaleDateString();

      function rbtns(t) {
        const m = mine(t), me = m && emo(m);
        return '<span class="b-rx">' + PAL.map(function (e) {
          const n = cnt(t, e);
          return '<button data-act="react" class="rx' + (me === e ? ' on' : '') + (n ? '' : ' zero') + '" data-t="' + t + '" data-e="' + e + '" aria-label="React ' + e + '">' + e + (n ? '<i>' + n + '</i>' : '') + '</button>';
        }).join('') + '</span>';
      }

      function box(k, p, c) {
        return '<div class="cbox"><textarea rows="2" maxlength="2000" data-k="' + k + '" placeholder="' + (c ? 'Write your reply… (@ to mention)' : 'Write a comment… (@ to mention)') + '">' + esc(drafts[k] || '') + '</textarea>' +
          (c ? '<label><input type="checkbox" class="qchk"> Quote the comment I am replying to</label>' : '') +
          '<div class="b-actions"><button data-act="send" data-p="' + p + '" data-c="' + (c || '') + '">Send</button>' +
          (c ? '<button data-act="cancel">Cancel</button>' : '') + '</div></div>';
      }

      function commentHtml(c, d) {
        const kids = comments.filter(x => x.parent_id === c.id);
        const par = d > 3 ? comments.find(x => x.id === c.parent_id) : null;
        return '<div class="comment" data-aid="c' + c.id + '"><div class="blog-meta"><strong>' + esc(c.author) + '</strong> · ' + day(c.created_at) + (par ? ' · ↩ @' + esc(par.author) : '') + '</div>' +
          (c.quote_text ? '<blockquote><strong>' + esc(c.quote_author || '') + '</strong>: ' + esc(c.quote_text) + '</blockquote>' : '') +
          '<div class="blog-text">' + fmt(c.body) + '</div>' +
          '<div class="b-actions">' + rbtns('c' + c.id) + '<button data-act="reply" data-c="' + c.id + '">↩ Reply</button>' +
          (email && c.email === email ? '<button data-act="del-c" data-c="' + c.id + '">Delete</button>' : '') + '</div>' +
          (replyTo === c.id ? box('c' + c.id, c.post_id, c.id) : '') +
          (kids.length ? '<div class="' + (d < 3 ? 'c-children' : 'c-flat') + '">' + kids.map(k => commentHtml(k, d + 1)).join('') + '</div>' : '') + '</div>';
      }

      // Who is in the post's photo: "Tag someone" picks call signs; ✕ removes a tag (yours, about you, or on your post).
      function tagRow(p) {
        const tg = ptags.filter(t => t.post_id === p.id), has = new Set(tg.map(t => t.email));
        return '<div class="tg-row b-tags"><span class="tg-l">🏷 In this photo:</span>' +
          (tg.length ? tg.map(t => '<span class="tg">' + esc(nameOfE(t.email)) + ((t.tagged_by === email || t.email === email || p.email === email) ? '<button type="button" data-act="untag" data-p="' + p.id + '" data-e="' + esc(t.email) + '" aria-label="Remove tag">✕</button>' : '') + '</span>').join('') : '<span class="tg-n">nobody tagged yet</span>') +
          '<button type="button" class="tg-add" data-act="tagging" data-p="' + p.id + '">' + (tagPost === p.id ? 'Done' : '＋ Tag someone') + '</button></div>' +
          (tagPost === p.id ? '<div class="tg-pick">' + nk.filter(n => !has.has(n.email)).sort((a, b) => String(a.nickname).localeCompare(String(b.nickname))).map(n => '<button type="button" data-act="tag" data-p="' + p.id + '" data-e="' + esc(n.email) + '">' + esc(n.nickname) + (n.email === email ? ' (me)' : '') + '</button>').join('') + '</div>' : '');
      }
      // The place of the post's photo, set by its author.
      TT.place.register('post', {
        save: async function (id, v) {
          const r = await fetch(R + 'posts?id=eq.' + id + '&email=eq.' + encodeURIComponent(email), { method: 'PATCH', headers: Object.assign({ Prefer: 'return=minimal' }, HJ), body: JSON.stringify(v) });
          if (!r.ok) throw 0;
          const p = posts.find(x => String(x.id) === String(id)); if (p) Object.assign(p, v);
        },
        rerender: render
      });
      async function tag(pid, who, on) {
        if (!who || !email) return;
        if (on) ptags.push({ post_id: pid, email: who, tagged_by: email }); else ptags = ptags.filter(t => !(t.post_id === pid && t.email === who));
        render();
        try {
          const r = on
            ? await fetch(R + 'post_tags', { method: 'POST', headers: Object.assign({ Prefer: 'return=minimal' }, HJ), body: JSON.stringify({ post_id: pid, email: who, tagged_by: email }) })
            : await fetch(R + 'post_tags?post_id=eq.' + pid + '&email=eq.' + encodeURIComponent(who), { method: 'DELETE', headers: H });
          if (!r.ok) throw 0;
        } catch (x) { toast('The tag could not be saved. Please try again.'); load(); }
      }

      function anchor() {
        let pick = null;
        document.querySelectorAll('#blog-list [data-aid]').forEach(function (e) {
          const r = e.getBoundingClientRect();
          if (r.bottom > 80 && r.top <= 200) pick = { id: e.dataset.aid, top: r.top };
        });
        if (!pick) {
          const f = Array.from(document.querySelectorAll('#blog-list [data-aid]')).find(function (e) { return e.getBoundingClientRect().bottom > 80; });
          if (f) pick = { id: f.dataset.aid, top: f.getBoundingClientRect().top };
        }
        if (pick) pick.y = window.scrollY;
        return pick;
      }

      function restore(a) {
        if (!a) return;
        const e = document.querySelector('#blog-list [data-aid="' + a.id + '"]');
        if (e) window.scrollBy({ top: e.getBoundingClientRect().top - a.top, behavior: 'instant' });
        else window.scrollTo({ top: a.y, behavior: 'instant' });
      }

      function render() {
        const a = anchor();
        draw();
        restore(a);
      }

      function draw() {
        const q = $('blog-search').value.trim().toLowerCase();
        const list = posts.filter(p => !q || (p.title + ' ' + p.body + ' ' + p.author).toLowerCase().indexOf(q) > -1);
        $('blog-list').innerHTML =
          (broken ? '<p class="warn">⚠ Comments and likes are not set up in the database yet. The setup SQL for the Blog needs to be run in Supabase.</p>' : '') +
          (list.length ? list.map(p => {
            const cs = comments.filter(c => c.post_id === p.id);
            return '<article class="blog-post" data-aid="p' + p.id + '"><h3>' + esc(p.title) + '</h3>' +
              '<div class="blog-meta"><strong>' + esc(p.author) + '</strong> · ' + day(p.created_at) + '</div>' +
              (p.image_url ? '<img src="' + esc(p.image_url) + '" alt="" loading="lazy">' + tagRow(p) + TT.place.html('post:' + p.id, p, p.email === email) : '') +
              '<div class="blog-text">' + fmt(p.body) + '</div>' +
              '<div class="b-actions">' + rbtns('p' + p.id) +
              '<button data-act="toggle" data-p="' + p.id + '">💬 ' + cs.length + (cs.length === 1 ? ' comment' : ' comments') + (open[p.id] ? ' ▲' : ' ▼') + '</button>' +
              (email && p.email === email ? '<button data-act="del-p" data-id="' + p.id + '">Delete</button>' : '') + '</div>' +
              (open[p.id] ? '<div class="comments">' + box('p' + p.id, p.id, null) + cs.filter(c => !c.parent_id).map(c => commentHtml(c, 1)).join('') + '</div>' : '') +
              '</article>';
          }).join('') : '<p class="intro">No posts found.</p>') +
          (posts.length >= limit ? '<button class="more" data-act="more">Show older posts</button>' : '');
      }

      // Tap an emoji to react, another one to change it, the same one again to remove it.
      async function react(t, e) {
        if (!who()) return;
        const m = mine(t), same = m && emo(m) === e;
        reacts = reacts.filter(x => !(x.target === t && x.email === email));
        if (!same) reacts.push({ target: t, email: email, value: 1, emoji: e });
        render();
        try {
          const r = same
            ? await fetch(R + 'reactions?target=eq.' + encodeURIComponent(t) + '&email=eq.' + encodeURIComponent(email), { method: 'DELETE', headers: H })
            : await fetch(R + 'reactions?on_conflict=target,email', { method: 'POST', headers: Object.assign({ Prefer: 'resolution=merge-duplicates,return=minimal' }, HJ), body: JSON.stringify({ target: t, email: email, value: 1, emoji: e }) });
          if (!r.ok) throw new Error('fail');
        } catch (e) { toast('Could not save your vote. The database may not be set up yet.'); load(); }
      }

      async function sendComment(b) {
        const p = +b.dataset.p, c = b.dataset.c ? +b.dataset.c : null, k = c ? 'c' + c : 'p' + p;
        const text = (drafts[k] || '').trim();
        if (!text) { toast('Write something first.'); return; }
        if (!who()) return;
        if (!nick) { toast('Choose your call sign first.'); return; }
        const chk = b.closest('.cbox').querySelector('.qchk');
        const src = c ? comments.find(x => x.id === c) : null;
        const q = chk && chk.checked && src;
        try {
          const r = await fetch(R + 'comments', {
            method: 'POST', headers: Object.assign({ Prefer: 'return=minimal' }, HJ),
            body: JSON.stringify({ post_id: p, parent_id: c, email: email, author: nick, body: text,
                                   quote_author: q ? src.author : null, quote_text: q ? src.body.slice(0, 200) : null })
          });
          if (!r.ok) throw new Error('fail');
          drafts[k] = ''; replyTo = null; open[p] = true;
          await load();
          toast('Comment sent.');
        } catch (err) { toast('Could not send the comment. The database may not be set up yet.'); }
      }

      $('blog-list').addEventListener('input', function (e) {
        const k = e.target.dataset && e.target.dataset.k;
        if (k) drafts[k] = e.target.value;
      });

      $('blog-list').addEventListener('click', async function (e) {
        const b = e.target.closest('button');
        if (!b || !b.dataset.act) return;
        const a = b.dataset.act;
        if (a === 'more') { limit += 30; load(); }
        else if (a === 'react') react(b.dataset.t, b.dataset.e);
        else if (a === 'tagging') { tagPost = tagPost === +b.dataset.p ? null : +b.dataset.p; render(); }
        else if (a === 'tag') tag(+b.dataset.p, b.dataset.e, true);
        else if (a === 'untag') tag(+b.dataset.p, b.dataset.e, false);
        else if (a === 'toggle') { open[+b.dataset.p] = !open[+b.dataset.p]; render(); }
        else if (a === 'cancel') { replyTo = null; render(); }
        else if (a === 'send') sendComment(b);
        else if (a === 'reply') {
          replyTo = +b.dataset.c;
          render();
          const t = document.querySelector('[data-k="c' + replyTo + '"]');
          if (t) { t.focus({ preventScroll: true }); t.scrollIntoView({ block: 'nearest', behavior: 'instant' }); }
        } else if (a === 'del-c' || a === 'del-p') {
          if (!who() || !confirm('Delete this?')) return;
          const q = a === 'del-c' ? 'comments?id=eq.' + b.dataset.c : 'posts?id=eq.' + b.dataset.id;
          try {
            const r = await fetch(R + q + '&email=eq.' + encodeURIComponent(email), { method: 'DELETE', headers: H });
            if (!r.ok) throw new Error('fail');
          } catch (err) { toast('Could not delete.'); }
          load();
        }
      });

      $('blog-search').addEventListener('input', render);

      /* ---- @ mentions: type @ in a post or comment and pick a call sign ---- */
      const sug = document.createElement('div'); sug.className = 'b-sug';
      let sugFor = null;
      function suggest(ta) {
        const before = ta.value.slice(0, ta.selectionStart || ta.value.length), mt = before.match(/(?:^|\s)@([^@\s][^@\n]{0,23}|)$/u);
        const q = mt ? mt[1].toLowerCase() : null;
        // Every member (no limit), alphabetical; "@ham" also finds "Jack Hammer".
        const list = q === null ? [] : names.filter(n => n !== nick && (' ' + n.toLowerCase()).indexOf(' ' + q) > -1).sort((a, b) => a.localeCompare(b));
        if (!list.length) { sug.remove(); sugFor = null; return; }
        sug.innerHTML = list.map(n => '<button type="button" data-n="' + esc(n) + '">@' + esc(n) + '</button>').join('');
        sugFor = ta; ta.insertAdjacentElement('afterend', sug);
      }
      document.addEventListener('input', function (e) {
        const ta = e.target;
        if (ta.tagName === 'TEXTAREA' && (ta.id === 'blog-body' || (ta.dataset && ta.dataset.k))) suggest(ta);
      });
      sug.addEventListener('mousedown', function (e) { e.preventDefault(); }); // keep the keyboard open
      sug.addEventListener('click', function (e) {
        const b = e.target.closest('[data-n]'); if (!b || !sugFor) return;
        e.stopPropagation();
        const ta = sugFor, pos = ta.selectionStart || ta.value.length, before = ta.value.slice(0, pos).replace(/@[^@\n]{0,24}$/u, '');
        ta.value = before + '@' + b.dataset.n + ' ' + ta.value.slice(pos);
        const c = (before + '@' + b.dataset.n + ' ').length; ta.setSelectionRange(c, c);
        if (ta.dataset.k) drafts[ta.dataset.k] = ta.value;
        sug.remove(); sugFor = null; ta.focus();
      });

      $('blog-form').addEventListener('submit', async function (e) {
        e.preventDefault();
        const msg = $('blog-msg'), btn = $('blog-send');
        if (!who()) return;
        if (!nick) { msg.textContent = 'Choose your nickname first.'; return; }
        btn.disabled = true;
        msg.textContent = 'Publishing…';
        try {
          let image = null;
          const f = $('blog-photo').files[0];
          if (f) {
            const blob = await shrink(f);
            const path = Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.jpg';
            const up = await fetch(BASE + '/storage/v1/object/blog-images/' + path, { method: 'POST', headers: Object.assign({ 'Content-Type': 'image/jpeg' }, H), body: blob });
            if (!up.ok) throw new Error('upload');
            image = BASE + '/storage/v1/object/public/blog-images/' + path;
          }
          const author = nick;
          const r = await fetch(R + 'posts', {
            method: 'POST', headers: Object.assign({ Prefer: 'return=minimal' }, HJ),
            body: JSON.stringify({ email: email, author: author, title: $('blog-title').value.trim(), body: $('blog-body').value.trim(), image_url: image })
          });
          if (!r.ok) throw new Error('save');
          $('blog-title').value = ''; $('blog-body').value = ''; $('blog-photo').value = '';
          msg.textContent = 'Published!';
          load();
        } catch (err) { msg.textContent = 'Sorry, something went wrong. Please try again.'; }
        btn.disabled = false;
      });

      load();
    })();
