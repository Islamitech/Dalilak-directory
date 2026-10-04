import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Refreshing the map starts at city scope unless a specific building deep link is loaded.
const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
if (navigation?.type === 'reload' && ['/', '/map'].includes(window.location.pathname)) {
  const url = new URL(window.location.href);
  if (!url.searchParams.has('bldg')) {
    url.searchParams.delete('zone');
    window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
  }
}
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register Service Worker in production for offline shell & PWA resiliency with instant update checking
if (typeof window !== 'undefined' && 'serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      registration.update();
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker) {
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              installingWorker.postMessage('skipWaiting');
            }
          };
        }
      };
    }).catch((err) => {
      console.warn('[Dalilak Directory PWA] Service Worker registration skipped:', err);
    });
  });
}


