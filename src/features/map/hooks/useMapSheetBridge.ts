import { useEffect } from 'react';
import { stashCameraReturn, takeCameraReturn, type SavedCamera } from '../utils/mapCameraMemory';

function leafletMap(): any {
  return (document.querySelector('.leaflet-map-canvas') as any)?._leaflet_map ?? null;
}

/** Sheet drags must not pan the map, and closing a building restores the camera. */
export function useMapSheetBridge() {
  useEffect(() => {
    const onDrag = (event: Event) => {
      const dragging = leafletMap()?.dragging;
      if (!dragging) return;
      if ((event as CustomEvent<{ active?: boolean }>).detail?.active) dragging.disable();
      else dragging.enable();
    };
    const onPop = () => {
      if (new URLSearchParams(window.location.search).get('bldg')) return;
      const camera: SavedCamera | null = takeCameraReturn();
      if (!camera) return;
      leafletMap()?.flyTo([camera.lat, camera.lng], camera.zoom, { duration: 0.45 });
    };
    const onStash = () => stashCameraReturn();
    window.addEventListener('map:sheet-drag', onDrag);
    window.addEventListener('popstate', onPop);
    window.addEventListener('map:stash-camera', onStash);
    return () => {
      window.removeEventListener('map:sheet-drag', onDrag);
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('map:stash-camera', onStash);
    };
  }, []);
}
