export interface LeafletLoaderOptions {
  doc?: Document | any;
  win?: Window | any;
  onSuccess: () => void;
  onError: (err?: any) => void;
}

interface PendingLeafletLoad {
  waiters: Set<{ onSuccess: () => void; onError: (err?: any) => void }>;
}

const IN_FLIGHT_KEY = '__dalilakLeafletPending';

export function loadLeafletScript({
  doc = typeof document !== 'undefined' ? document : null,
  win = typeof window !== 'undefined' ? window : null,
  onSuccess,
  onError,
}: LeafletLoaderOptions): () => void {
  if (!doc || !win) return () => {};

  if (win.L) {
    onSuccess();
    return () => {};
  }

  // Single-flight: every caller joins ONE load. Appending a second script (or removing the
  // in-flight one) can execute a second Leaflet copy whose window.L assignment overwrites the
  // copy that built the map — cross-copy bounds then silently break camera flights.
  const waiter = { onSuccess, onError };
  let pending: PendingLeafletLoad | undefined = win[IN_FLIGHT_KEY];

  if (!pending) {
    const created: PendingLeafletLoad = { waiters: new Set() };
    pending = created;
    win[IN_FLIGHT_KEY] = created;

    if (!doc.querySelector('link[href*="leaflet.css"]')) {
      const link = doc.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      link.crossOrigin = '';
      doc.head.appendChild(link);
    }

    const script = doc.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    script.crossOrigin = '';

    const handleLoad = () => {
      if (win.L) settle();
      else settle(new Error('Leaflet script loaded but window.L is unavailable'));
    };
    const handleError = (err?: any) => settle(err || new Error('Failed to load the Leaflet script'));

    const cleanupListeners = () => {
      script.onload = null;
      script.onerror = null;
      if (typeof script.removeEventListener === 'function') {
        script.removeEventListener('load', handleLoad);
        script.removeEventListener('error', handleError);
      }
    };

    const settle = (err?: any) => {
      if (win[IN_FLIGHT_KEY] !== created) return;
      win[IN_FLIGHT_KEY] = null;
      cleanupListeners();
      // A failed script element must not linger, so a retry performs a fresh network request.
      if (err) {
        if (typeof script.remove === 'function') script.remove();
        else if (script.parentNode) script.parentNode.removeChild(script);
      }
      const current = Array.from(created.waiters);
      created.waiters.clear();
      current.forEach((w) => (err ? w.onError(err) : w.onSuccess()));
    };

    script.onload = handleLoad;
    script.onerror = handleError;
    if (typeof script.addEventListener === 'function') {
      script.addEventListener('load', handleLoad);
      script.addEventListener('error', handleError);
    }

    doc.head.appendChild(script);
  }

  const joined = pending;
  joined.waiters.add(waiter);
  return () => {
    joined.waiters.delete(waiter);
  };
}
