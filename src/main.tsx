import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
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
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);


