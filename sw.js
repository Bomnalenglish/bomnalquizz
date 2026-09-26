/* 봄날퀴즈 · 앱 설치를 위한 최소 서비스워커
   - 캐시하지 않는다(자료가 자주 바뀌므로 항상 최신을 받는다)
   - 안드로이드 크롬에서 '앱 설치'가 뜨려면 이 파일이 필요하다 */
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
