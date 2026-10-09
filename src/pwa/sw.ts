/// <reference lib="webworker" />
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute, setCatchHandler } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare let self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html'), {
  denylist: [/^\/api\//, /\/offline\.html$/],
}));

registerRoute(
  ({ url }) => url.hostname.endsWith('supabase.co') && url.pathname.includes('/rest/'),
  new NetworkFirst({
    cacheName: 'dalilak-directory',
    networkTimeoutSeconds: 4,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 80, maxAgeSeconds: 24 * 60 * 60 }),
    ],
  })
);

registerRoute(
  ({ url, request }) =>
    request.destination === 'image' ||
    url.hostname.includes('googleusercontent.com') ||
    url.hostname.includes('ggpht.com') ||
    url.pathname.includes('/storage/v1/render/image/'),
  new CacheFirst({
    cacheName: 'dalilak-images',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 120, maxAgeSeconds: 14 * 24 * 60 * 60 }),
    ],
  })
);

setCatchHandler(async ({ request }) => {
  if (request.destination === 'document') {
    const offline = await caches.match('/offline.html');
    if (offline) return offline;
  }
  return Response.error();
});

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting' || event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
