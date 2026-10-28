// 앱 파일을 기기에 저장해 두어 오프라인에서도 열리게 합니다.
// 인터넷이 되면 항상 최신 파일을 먼저 받아 오고, 안 될 때만 저장된 파일을 씁니다.
const CACHE = 'alba-pay-v10';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png', './duck.png'];
const TIMEOUT = 4000; // 이 시간(ms) 안에 응답이 없으면 저장된 파일로 열어요

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// 최신 파일 먼저 → 실패하거나 너무 느리면 저장된 파일
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const net = fetch(e.request.url, { cache: 'no-cache' }).then(r => {
      if (r.ok) c.put(e.request, r.clone());
      return r;
    });
    const slow = new Promise((_, reject) => setTimeout(reject, TIMEOUT));
    try {
      return await Promise.race([net, slow]);
    } catch (err) {
      const hit = await c.match(e.request, { ignoreSearch: true });
      return hit || net;
    }
  }));
});
