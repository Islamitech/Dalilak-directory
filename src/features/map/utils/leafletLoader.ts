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

    const LEAFLET_CDNS = [
      {
        js: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
        css: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
        integrityJs: 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=',
        integrityCss: 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=',
      },
      {
        js: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js',
        css: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css',
        integrityJs: '',
        integrityCss: '',
      },
    ];

    let cdnIndex = 0;
    let activeScript: any = null;

    const cleanupActiveScript = () => {
      if (!activeScript) return;
      activeScript.onload = null;
      activeScript.onerror = null;
      if (typeof activeScript.remove === 'function') activeScript.remove();
      else if (activeScript.parentNode) activeScript.parentNode.removeChild(activeScript);
      activeScript = null;
    };

    const settle = (err?: any) => {
      if (win[IN_FLIGHT_KEY] !== created) return;
      win[IN_FLIGHT_KEY] = null;
      if (err) cleanupActiveScript();
      const current = Array.from(created.waiters);
      created.waiters.clear();
      current.forEach((w) => (err ? w.onError(err) : w.onSuccess()));
    };

    const tryNextCdn = () => {
      if (cdnIndex >= LEAFLET_CDNS.length) {
        settle(new Error('Failed to load the Leaflet script from all available CDNs'));
        return;
      }

      cleanupActiveScript();
      const cdn = LEAFLET_CDNS[cdnIndex++];

      if (!doc.querySelector('link[href*="leaflet"]')) {
        const link = doc.createElement('link');
        link.rel = 'stylesheet';
        link.href = cdn.css;
        if (cdn.integrityCss) link.integrity = cdn.integrityCss;
        link.crossOrigin = '';
        doc.head.appendChild(link);
      }

      const script = doc.createElement('script');
      script.src = cdn.js;
      if (cdn.integrityJs) script.integrity = cdn.integrityJs;
      script.crossOrigin = '';
      activeScript = script;

      const handleLoad = () => {
        if (win.L) settle();
        else tryNextCdn();
      };
      const handleError = () => {
        tryNextCdn();
      };

      script.onload = handleLoad;
      script.onerror = handleError;
      doc.head.appendChild(script);
    };

    tryNextCdn();
  }

  const joined = pending;
  joined.waiters.add(waiter);
  return () => {
    joined.waiters.delete(waiter);
  };
}
