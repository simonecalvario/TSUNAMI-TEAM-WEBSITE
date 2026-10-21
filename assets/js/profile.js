/* Member profiles: "choose your liquid" (under the Statute) and the home city used by Reconnect and Wrapped. */
(function () {
  const $ = id => document.getElementById(id), esc = TT.esc, L = TT.LIQUIDS;
  let email = null, rows = [];
  const mine = () => rows.find(r => r.email === email) || null;

  async function load() {
    rows = (await TT.api.get('profiles?select=*')) || [];
    TT.set('profiles', rows);
    render();
  }
  async function save(patch) {
    if (!email) return;
    const row = Object.assign({}, mine() || {}, patch, { email: email, updated_at: new Date().toISOString() });
    delete row.created_at;
    await TT.api.upsert('profiles', row, 'email');
    await load();
  }
  TT.profile = { save: save, mine: mine, all: () => rows, reload: load };

  function render() {
    const box = $('st-choose'); if (!box) return;
    const me = mine(), cur = me && me.liquid;
    const count = {}; rows.forEach(r => { if (r.liquid) count[r.liquid] = (count[r.liquid] || 0) + 1; });
    box.innerHTML = '<h3>' + (cur ? 'You chose to be ' + L[cur].ic + ' ' + esc(L[cur].n) : 'And you? Choose your liquid') + '</h3>' +
      '<p>' + (cur ? 'You can change it whenever life changes your shape.' : 'Which state of water are you today? It shows on your card for the whole crew.') + '</p>' +
      '<div class="liq-opts">' + Object.keys(L).map(k => '<button type="button" data-l="' + k + '" class="' + (k === cur ? 'on' : '') + '"><i>' + L[k].ic + '</i><b>' + esc(L[k].n) + '</b><small>' + esc(L[k].d) + '</small></button>').join('') + '</div>' +
      (Object.keys(count).length ? '<p class="liq-crew">The crew today: ' + Object.keys(L).filter(k => count[k]).map(k => L[k].ic + ' ' + count[k] + ' ' + esc(L[k].n.toLowerCase()) + (count[k] > 1 ? 's' : '')).join(' · ') + '</p>' : '');
  }
  document.addEventListener('click', function (e) {
    const b = e.target.closest && e.target.closest('#st-choose [data-l]'); if (!b) return;
    const k = b.dataset.l, me = mine();
    save({ liquid: me && me.liquid === k ? null : k });
  });
  TT.identity().then(e => { email = e; load(); });
})();
