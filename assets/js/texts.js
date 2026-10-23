/* Site texts: fixes made by the owner from the site itself (the small ✏️ next to each text).
   Every static text of the page has a data-tx key (tools/tag-texts.py). A saved fix replaces it for everyone,
   as long as the original text in the page is still the same one it was written for. */
(function () {
  const OWNER = 'simone.calvario@gmail.com';
  const els = Array.prototype.slice.call(document.querySelectorAll('[data-tx]')); if (!els.length) return;
  const norm = t => String(t || '').replace(/\s+/g, ' ').trim();
  const orig = {}, saved = {};
  els.forEach(el => { orig[el.dataset.tx] = { html: el.innerHTML, text: norm(el.textContent) }; });

  // Only simple formatting survives: bold, italic, line breaks, links.
  const OK = { B: 1, STRONG: 1, I: 1, EM: 1, BR: 1, SPAN: 1, A: 1 };
  function clean(html) {
    const t = document.createElement('template'); t.innerHTML = html;
    (function walk(n) {
      Array.prototype.slice.call(n.childNodes).forEach(function (c) {
        if (c.nodeType === 3) return;
        if (c.nodeType !== 1) { c.remove(); return; }
        walk(c);
        if (!OK[c.tagName]) {
          const f = document.createDocumentFragment();
          if (c.tagName === 'DIV' || c.tagName === 'P') f.appendChild(document.createElement('br'));
          while (c.firstChild) f.appendChild(c.firstChild);
          c.replaceWith(f); return;
        }
        Array.prototype.slice.call(c.attributes).forEach(function (a) {
          const keep = (c.tagName === 'A' && a.name === 'href' && /^(https?:|mailto:|#)/i.test(a.value)) || (c.tagName === 'SPAN' && a.name === 'class');
          if (!keep) c.removeAttribute(a.name);
        });
      });
    })(t.content);
    return t.innerHTML.replace(/^(\s*<br>)+|(<br>\s*)+$/g, '').trim();
  }

  function apply(rows) {
    (rows || []).forEach(function (r) {
      const el = document.querySelector('[data-tx="' + r.key + '"]'), o = orig[r.key];
      if (!el || !o || o.text !== r.orig) return; // the page text changed since: the fix no longer applies
      saved[r.key] = r.html;
      if (!open || open.el !== el) { el.innerHTML = clean(r.html); pen(el); }
    });
  }
  TT.api.get('site_texts?select=key,orig,html').then(apply);

  /* ---- owner only: a small ✏️ next to every text ---- */
  let owner = false, toastT = null;
  function toast(t) {
    let el = document.getElementById('tx-toast');
    if (!el) { el = document.createElement('div'); el.id = 'tx-toast'; document.body.appendChild(el); }
    el.textContent = t; el.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2200);
  }
  // The pencil lives inside the text but is never part of what gets saved.
  const body = el => { const c = el.cloneNode(true); c.querySelectorAll('.tx-pen').forEach(x => x.remove()); return c.innerHTML; };
  function pen(el) {
    if (!owner || el.querySelector('.tx-pen')) return;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'tx-pen'; b.textContent = '✏️';
    b.setAttribute('contenteditable', 'false'); b.setAttribute('aria-label', 'Edit this text');
    // Founder bios are cut short until "Read more": put their pencil first so it is always visible.
    if (el.classList.contains('desc')) el.insertBefore(b, el.firstChild); else el.appendChild(b);
  }
  let open = null;
  function start(el) {
    if (open) stop(open, false);
    open = { el: el, before: body(el) };
    el.querySelectorAll('.tx-pen').forEach(x => x.remove());
    const card = el.closest('.founder-card'); if (card) card.classList.add('tx-open');
    el.setAttribute('contenteditable', 'true'); el.spellcheck = true; el.classList.add('tx-on');
    const bar = document.createElement('div'); bar.className = 'tx-bar';
    bar.innerHTML = '<button type="button" data-tx-a="save">Save</button><button type="button" data-tx-a="cancel">Cancel</button>' + (saved[el.dataset.tx] != null ? '<button type="button" data-tx-a="orig">Original text</button>' : '');
    el.insertAdjacentElement('afterend', bar);
    el.focus();
    try { const r = document.createRange(); r.selectNodeContents(el); r.collapse(false); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); } catch (x) {}
  }
  async function stop(o, action) {
    const el = o.el, k = el.dataset.tx, base = orig[k];
    let html = clean(body(el));
    if (action === 'orig') html = clean(base.html);
    el.removeAttribute('contenteditable'); el.classList.remove('tx-on');
    const bar = el.nextElementSibling; if (bar && bar.classList.contains('tx-bar')) bar.remove();
    const card = el.closest('.founder-card'); if (card) card.classList.remove('tx-open');
    open = null;
    if (!action) { el.innerHTML = o.before; pen(el); return; } // cancel
    el.innerHTML = html; pen(el);
    if (html === clean(o.before)) return;
    try {
      if (html === clean(base.html)) { await TT.api.remove('site_texts?key=eq.' + encodeURIComponent(k)); delete saved[k]; toast('Back to the original ✓'); }
      else { await TT.api.upsert('site_texts', { key: k, orig: base.text, html: html, updated_at: new Date().toISOString() }, 'key'); saved[k] = html; toast('Saved ✓ Everyone sees the new text'); }
    } catch (x) { el.innerHTML = o.before; pen(el); toast('Not saved: try again in a moment.'); }
  }
  TT.identity().then(function (e) {
    if (e !== OWNER) return;
    owner = true; document.body.classList.add('tx-owner');
    els.forEach(pen);
    document.addEventListener('click', function (ev) {
      const t = ev.target.closest && ev.target;
      if (!t) return;
      const p = t.closest('.tx-pen');
      if (p) { ev.preventDefault(); ev.stopPropagation(); start(p.closest('[data-tx]')); return; }
      const a = t.closest('[data-tx-a]');
      if (a && open) { ev.preventDefault(); ev.stopPropagation(); stop(open, a.dataset.txA === 'cancel' ? null : a.dataset.txA); return; }
      if (open && t.closest('.tx-on')) { const l = t.closest('a'); if (l) ev.preventDefault(); } // no navigation while editing
    }, true);
    document.addEventListener('keydown', function (ev) {
      if (!open || !ev.target.closest || !ev.target.closest('.tx-on')) return;
      if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); document.execCommand('insertLineBreak'); }
      if (ev.key === 'Escape') stop(open, null);
    });
    document.addEventListener('paste', function (ev) {
      if (!open || !ev.target.closest || !ev.target.closest('.tx-on')) return;
      ev.preventDefault(); document.execCommand('insertText', false, (ev.clipboardData || window.clipboardData).getData('text/plain'));
    });
  });
})();
