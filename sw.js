// Çevrimdışı oynamak için dosyaları önbelleğe alır
const ONBELLEK = "karcarki-1";
const DOSYALAR = ["./", "index.html", "style.css", "kelimeler.js", "uretici.js", "oyun.js", "manifest.json", "icons/ikon.svg"];
self.addEventListener("install", e => { e.waitUntil(caches.open(ONBELLEK).then(c => c.addAll(DOSYALAR))); self.skipWaiting(); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(n => n !== ONBELLEK).map(n => caches.delete(n)))));
  self.clients.claim();
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(fetch(e.request).then(r => {
    if (r.ok && new URL(e.request.url).origin === location.origin) {
      const kopya = r.clone(); caches.open(ONBELLEK).then(c => c.put(e.request, kopya));
    }
    return r;
  }).catch(() => caches.match(e.request)));
});
