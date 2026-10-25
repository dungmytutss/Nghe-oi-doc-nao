/* Bộ nhớ đệm «Nghé ơi, đọc nào!» — phiên bản 20261025-2137. Mở lần đầu có mạng; sau đó dùng được khi mất mạng. */
const KHO = "nghe-oi-20261025-2137";
const TEP = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(KHO).then(c => c.addAll(TEP)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ds => Promise.all(ds.filter(k => k !== KHO).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(caches.match(e.request, {ignoreSearch: true}).then(c => c || fetch(e.request).then(r => {
    if (r && r.ok && new URL(e.request.url).origin === location.origin){ const b = r.clone(); caches.open(KHO).then(k => k.put(e.request, b)); }
    return r;
  }).catch(() => caches.match("index.html"))));
});
