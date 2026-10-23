/* Site texts: fixes made by the owner from the site itself ("✏️ Edit texts").
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
      if (!editing) el.innerHTML = clean(r.html);
    });
  }
  TT.api.get('site_texts?select=key,orig,html').then(apply);

  /* ---- owner only: edit mode ---- */
  let editing = false, btn = null, toastT = null;
  function toast(t) {
    let el = document.getElementById('tx-toast');
    if (!el) { el = document.createElement('div'); el.id = 'tx-toast'; document.body.appendChild(el); }
    el.textContent = t; el.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2200);
  }
  function setMode(on) {
    editing = on;
    document.body.classList.toggle('tx-edit', on);
    btn.textContent = on ? '✓ Done editing' : '✏️ Edit texts';
    els.forEach(el => { if (on) el.setAttribute('contenteditable', 'true'); else el.removeAttribute('contenteditable'); el.spellcheck = on; });
    // Founder bios are cut short until "Read more": open them all while editing.
    document.querySelectorAll('.founder-card').forEach(c => c.classList.toggle('tx-open', on));
    if (on) toast('Tap a text, fix it, then tap outside it to save.');
  }
  async function save(el) {
    const k = el.dataset.tx, o = orig[k], html = clean(el.innerHTML);
    if (html === clean(saved[k] != null ? saved[k] : o.html)) return;
    try {
      if (html === clean(o.html)) { await TT.api.remove('site_texts?key=eq.' + encodeURIComponent(k)); delete saved[k]; toast('Back to the original ✓'); }
      else { await TT.api.upsert('site_texts', { key: k, orig: o.text, html: html, updated_at: new Date().toISOString() }, 'key'); saved[k] = html; toast('Saved ✓ Everyone sees the new text'); }
    } catch (x) { toast('Not saved: try again in a moment.'); }
  }
  TT.identity().then(function (e) {
    if (e !== OWNER) return;
    btn = document.createElement('button'); btn.type = 'button'; btn.id = 'tx-btn'; btn.textContent = '✏️ Edit texts';
    btn.addEventListener('click', function () { setMode(!editing); });
    document.body.appendChild(btn);
    document.addEventListener('focusout', function (ev) { const el = editing && ev.target.closest && ev.target.closest('[data-tx]'); if (el) save(el); });
    // While editing, links and taps inside a text must not navigate away.
    document.addEventListener('click', function (ev) { if (editing && ev.target.closest('[data-tx]')) { const a = ev.target.closest('a'); if (a) ev.preventDefault(); } }, true);
    document.addEventListener('keydown', function (ev) {
      if (!editing || !ev.target.closest || !ev.target.closest('[data-tx]')) return;
      if (ev.key === 'Enter') { ev.preventDefault(); document.execCommand('insertLineBreak'); }
      if (ev.key === 'Escape') ev.target.blur();
    });
    document.addEventListener('paste', function (ev) {
      if (!editing || !ev.target.closest || !ev.target.closest('[data-tx]')) return;
      ev.preventDefault(); document.execCommand('insertText', false, (ev.clipboardData || window.clipboardData).getData('text/plain'));
    });
  });
})();
