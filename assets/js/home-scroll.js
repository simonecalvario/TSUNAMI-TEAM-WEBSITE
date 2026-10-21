    window.addEventListener('load', function () {
      if (!location.hash) {
        const home = document.getElementById('home');
        if (home) {
          home.scrollIntoView({ behavior: 'auto', block: 'start' });
        }
      }
    });
