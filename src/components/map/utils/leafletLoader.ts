export interface LeafletLoaderOptions {
  doc?: Document | any;
  win?: Window | any;
  onSuccess: () => void;
  onError: (err?: any) => void;
}

export function loadLeafletScript({
  doc = typeof document !== 'undefined' ? document : null,
  win = typeof window !== 'undefined' ? window : null,
  onSuccess,
  onError,
}: LeafletLoaderOptions): () => void {
  if (!doc) return () => {};

  // Ensure Leaflet CSS is injected dynamically on demand (Zero-Head Leaflet)
  if (!doc.querySelector('link[href*="leaflet.css"]')) {
    const link = doc.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
    link.crossOrigin = '';
    doc.head.appendChild(link);
  }

  if (win?.L) {
    onSuccess();
    return () => {};
  }

  // Before any retry, remove any existing failed or stale Leaflet script element
  const staleScript = doc.querySelector('script[src*="leaflet.js"]');
  if (staleScript) {
    if (typeof staleScript.remove === 'function') {
      staleScript.remove();
    } else if (staleScript.parentNode) {
      staleScript.parentNode.removeChild(staleScript);
    }
  }

  // Create a fresh <script> element for a new network request
  const script = doc.createElement('script');
  script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
  script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
  script.crossOrigin = '';

  const cleanupListeners = () => {
    script.onload = null;
    script.onerror = null;
    if (typeof script.removeEventListener === 'function') {
      script.removeEventListener('load', handleLoad);
      script.removeEventListener('error', handleError);
    }
  };

  const handleLoad = () => {
    cleanupListeners();
    onSuccess();
  };

  const handleError = (err?: any) => {
    cleanupListeners();
    // On script error, remove the failed script element from DOM immediately
    if (typeof script.remove === 'function') {
      script.remove();
    } else if (script.parentNode) {
      script.parentNode.removeChild(script);
    }
    onError(err);
  };

  script.onload = handleLoad;
  script.onerror = handleError;
  if (typeof script.addEventListener === 'function') {
    script.addEventListener('load', handleLoad);
    script.addEventListener('error', handleError);
  }

  doc.head.appendChild(script);

  return () => {
    cleanupListeners();
  };
}
