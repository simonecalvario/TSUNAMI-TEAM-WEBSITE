/* Grouped desktop menu: tap to open on touch screens, highlight the group of the section in view. */
(function () {
  const groups = Array.prototype.slice.call(document.querySelectorAll('.nav-group'));
  groups.forEach(function (g) {
    g.querySelector('button').addEventListener('click', function (e) {
      e.stopPropagation();
      const open = !g.classList.contains('open');
      groups.forEach(x => x.classList.remove('open'));
      g.classList.toggle('open', open);
    });
    g.addEventListener('click', function (e) { if (e.target.closest('a')) g.classList.remove('open'); });
  });
  document.addEventListener('click', function () { groups.forEach(x => x.classList.remove('open')); });
  // ui.js toggles .active on the links; mirror it on the group button.
  const mark = () => groups.forEach(g => g.classList.toggle('has-active', !!g.querySelector('a.active')));
  new MutationObserver(mark).observe(document.querySelector('.nav-links'), { subtree: true, attributes: true, attributeFilter: ['class'] });
  // Reveal the three states of the Statute one after the other.
  const st = document.querySelector('.states');
  if (st && 'IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('js-reveal');
    new IntersectionObserver(function (en, o) { if (en.some(x => x.isIntersecting)) { st.classList.add('in'); o.disconnect(); } }, { threshold: 0.15 }).observe(st);
  }
})();
