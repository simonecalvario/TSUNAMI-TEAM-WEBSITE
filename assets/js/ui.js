    (function () {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // Header becomes solid after scrolling
      const header = document.querySelector('header');
      function onScroll() { header.classList.toggle('scrolled', window.scrollY > 30); }
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });

      // Highlight the menu link of the section being viewed
      const links = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));
      if ('IntersectionObserver' in window) {
        const spy = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) {
              links.forEach(function (a) {
                a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id);
              });
            }
          });
        }, { rootMargin: '-40% 0px -55% 0px' });
        links.forEach(function (a) {
          const sec = document.querySelector(a.getAttribute('href'));
          if (sec) spy.observe(sec);
        });

        // Fade-in sections on scroll
        if (!reduce) {
          const reveal = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
              if (e.isIntersecting) { e.target.classList.add('in'); reveal.unobserve(e.target); }
            });
          }, { threshold: 0.06 });
          document.querySelectorAll('section:not(.hero) > .container').forEach(function (el) {
            el.classList.add('reveal');
            reveal.observe(el);
          });
        }
      }

      // Floating bubbles in the hero
      const hero = document.querySelector('.hero');
      if (hero && !reduce) {
        for (let i = 0; i < 14; i++) {
          const b = document.createElement('span');
          const size = 6 + Math.random() * 18;
          b.className = 'bubble';
          b.style.width = b.style.height = size + 'px';
          b.style.left = (Math.random() * 100) + '%';
          b.style.animationDuration = (9 + Math.random() * 10) + 's';
          b.style.animationDelay = (-Math.random() * 14) + 's';
          hero.appendChild(b);
        }
      }
    })();
