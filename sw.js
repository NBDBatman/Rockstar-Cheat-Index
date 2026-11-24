// Offline support. Pages, scripts and every game's data are saved on the first visit;
// covers are saved as they're seen. Online, pages and data always come fresh from the
// network, so edits show up straight away. Only same-site files and Google Fonts are touched.
var CACHE = 'ci-v3';
var SHELL = ['./', 'index.html', 'game.html', 'assets/style.css', 'assets/theme.js', 'assets/common.js',
  'assets/home.js', 'assets/game.js', 'data/games.json', 'manifest.webmanifest', 'assets/icon.svg',
  'assets/icon-192.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (cache) {
    return cache.addAll(SHELL).then(function () {
      // Every game's page and data file, from the index, so any game opens offline.
      return fetch('data/games.json').then(function (r) { return r.json(); }).then(function (d) {
        return cache.addAll([].concat.apply([], d.games.map(function (g) { return ['games/' + g.slug + '/', 'data/' + g.slug + '.json']; })));
      }).catch(function () {});
    });
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

function save(req, res) {
  if (res && (res.ok || res.type === 'opaque')) {
    var copy = res.clone();
    caches.open(CACHE).then(function (c) { c.put(req, copy); });
  }
  return res;
}

// Offline, a page's saved copy serves any ?p= or &c= on it; a page never saved falls back to home.
function fromCache(req) {
  var nav = req.mode === 'navigate';
  return caches.match(req, { ignoreSearch: nav }).then(function (hit) {
    return hit || (nav ? caches.match('index.html') : undefined);
  });
}

// Network first, but fall back to the saved copy after 4 seconds on a bad signal.
function networkFirst(req) {
  return new Promise(function (resolve, reject) {
    var settled = false;
    var timer = setTimeout(function () {
      fromCache(req).then(function (hit) { if (hit && !settled) { settled = true; resolve(hit); } });
    }, 4000);
    fetch(req).then(function (res) {
      clearTimeout(timer);
      save(req, res);
      if (!settled) { settled = true; resolve(res); }
    }).catch(function () {
      clearTimeout(timer);
      fromCache(req).then(function (hit) {
        if (settled) return;
        settled = true;
        if (hit) resolve(hit); else reject(new Error('offline'));
      });
    });
  });
}

function cacheFirst(req) {
  return caches.match(req).then(function (hit) {
    return hit || fetch(req).then(function (res) { return save(req, res); });
  });
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  var fonts = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (url.origin !== self.location.origin && !fonts) return;
  var stable = url.hostname === 'fonts.gstatic.com' || url.pathname.indexOf('/covers/') !== -1;
  e.respondWith(stable ? cacheFirst(req) : networkFirst(req));
});
