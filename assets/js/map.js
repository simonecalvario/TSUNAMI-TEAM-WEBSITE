    (function () {
      const cities = [
        { name: 'Barcelona', coords: [41.3851, 2.1734], key: 'barcelona', url: '/barcelona.html', icon: 'assets/images/pins/barcelona.png', ar: 1088 / 944 },
        { name: 'Doha', coords: [25.2854, 51.5310], key: 'doha', url: '/doha.html', icon: 'assets/images/pins/doha.png', ar: 471 / 406 },
        { name: 'Munich', coords: [48.1351, 11.5820], key: 'munich', url: '/munich.html', icon: 'assets/images/pins/munich.png', ar: 911 / 765 }
      ];

      const initialZoom = 3;
      const baseSize = 40;
      const minSize = 18;
      const maxSize = 64;
      const zoomScale = 1.06;

      const map = L.map('world-map', { zoomControl: true }).setView([38, 14], initialZoom);
      window.ttMap = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      function sizeForZoom(zoom) {
        const rawScale = Math.pow(zoomScale, zoom - initialZoom);
        const lowZoomBias = zoom <= initialZoom ? 0.62 : 1;
        const s = Math.round(baseSize * rawScale * lowZoomBias);
        return Math.max(minSize, Math.min(maxSize, s));
      }

      const pinCounts = {};
      const markers = {};
      function createIcon(iconUrl, size, n, ar) {
        const h = Math.round(size / (ar || 1.1547));
        return L.divIcon({
          className: 'tt-pin',
          html: '<img src="' + iconUrl + '" alt="" style="width:100%;height:100%;display:block;object-fit:contain">' + (n > 0 ? '<span class="pin-n">' + n + '</span>' : ''),
          iconSize: [size, h],
          iconAnchor: [Math.round(size / 2), Math.round(h * 0.92)],
          popupAnchor: [0, -Math.round(h * 0.84)]
        });
      }
      function refreshPins() {
        const sz = sizeForZoom(map.getZoom());
        cities.forEach(c => { if (markers[c.key]) markers[c.key].setIcon(createIcon(c.icon, sz, pinCounts[c.key] || 0, c.ar)); });
      }

      cities.forEach(city => {
        const marker = L.marker(city.coords, { icon: createIcon(city.icon, sizeForZoom(map.getZoom()), 0, city.ar), keyboard: true }).addTo(map);
        markers[city.key] = marker;

        const popupHtml = `
          <div style="text-align:center; min-width:170px;">
            <strong style="display:block; margin-bottom:8px;">${city.name}</strong>
            <a href="${city.url}" style="display:inline-block; margin-top:6px; padding:8px 12px; background:#f5d21b; color:#101010; border-radius:6px; font-weight:700; text-decoration:none;">Go to the Gallery</a>
          </div>
        `;

        marker.bindPopup(popupHtml, {
          closeButton: true,
          className: 'meetings-popup'
        });

        marker.on('click', function () {
          marker.openPopup();
          const el = marker._icon;
          if (el) {
            el.classList.add('enlarged');
            setTimeout(() => el.classList.remove('enlarged'), 500);
          }
        });

        marker.on('popupopen', function () {
          const el = marker._icon;
          if (el) el.classList.add('enlarged');
        });

        marker.on('popupclose', function () {
          const el = marker._icon;
          if (el) el.classList.remove('enlarged');
        });
      });

      map.on('zoomend', refreshPins);

      fetch('https://dykofnyhwusghfowfxbi.supabase.co/rest/v1/meeting_photos?select=meeting', { headers: { apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5a29mbnlod3VzZ2hmb3dmeGJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwNjUwOTQsImV4cCI6MjEwNzY0MTA5NH0.wLS75UXlm2evHg1mlvjvrlJASDP9KRaE_b8fhnJ8htI', Authorization: 'Bearer ' + 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5a29mbnlod3VzZ2hmb3dmeGJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwNjUwOTQsImV4cCI6MjEwNzY0MTA5NH0.wLS75UXlm2evHg1mlvjvrlJASDP9KRaE_b8fhnJ8htI' } })
        .then(r => r.ok ? r.json() : [])
        .then(rows => { rows.forEach(x => { pinCounts[x.meeting] = (pinCounts[x.meeting] || 0) + 1; }); refreshPins(); })
        .catch(function () {});

      setTimeout(() => {
        document.querySelectorAll('.leaflet-marker-icon').forEach(el => {
          el.setAttribute('tabindex', '0');
          el.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') el.click();
          });
        });
      }, 400);
    })();
