// 난세무쌍 — 오프라인 실행용 서비스 워커
// 배포할 때 BUILD 값이 커밋 해시로 바뀌어 새 버전이 자동으로 받아진다.
const BUILD = 'dev';
const CACHE = `nanse-musang-${BUILD}`;
const FONT_CACHE = 'nanse-musang-fonts';
const SHELL = [
  './', 'index.html', 'style.css', 'manifest.webmanifest',
  'js/data.js', 'js/draw.js', 'js/game.js', 'js/ui.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== FONT_CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // 구글 폰트: 캐시에 있으면 바로 쓰고, 뒤에서 새로 받아 둔다
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(FONT_CACHE).then(async c => {
      const hit = await c.match(req);
      const net = fetch(req).then(res => { if (res.ok || res.type === 'opaque') c.put(req, res.clone()); return res; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }

  if (url.origin !== location.origin) return;

  // 게임 파일: 네트워크 우선(최신 버전), 안 되면 캐시(오프라인)
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res.ok) caches.open(CACHE).then(c => c.put(req, res.clone()));
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || caches.match('index.html'))),
  );
});
