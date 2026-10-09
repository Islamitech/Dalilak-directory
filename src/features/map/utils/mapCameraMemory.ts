const CAMERA_KEY = 'dalilak:map-camera';

export interface SavedCamera {
  lat: number;
  lng: number;
  zoom: number;
}

export function readSavedCamera(): SavedCamera | null {
  try {
    const raw = sessionStorage.getItem(CAMERA_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed.lat === 'number' && typeof parsed.lng === 'number' && typeof parsed.zoom === 'number') return parsed;
  } catch { /* private mode or bad json */ }
  return null;
}

export function rememberMapCamera(mode: string, camera: SavedCamera): void {
  if (mode !== 'view') return;
  try { sessionStorage.setItem(CAMERA_KEY, JSON.stringify(camera)); } catch { /* ignore */ }
}

const RETURN_KEY = 'dalilak:map-camera-return';

/** Remember the view once, before a building selection flies the camera away. */
export function stashCameraReturn(): void {
  try {
    if (sessionStorage.getItem(RETURN_KEY)) return;
    const current = readSavedCamera();
    if (current) sessionStorage.setItem(RETURN_KEY, JSON.stringify(current));
  } catch { /* ignore */ }
}

export function takeCameraReturn(): SavedCamera | null {
  try {
    const raw = sessionStorage.getItem(RETURN_KEY);
    sessionStorage.removeItem(RETURN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed.lat === 'number' && typeof parsed.lng === 'number' && typeof parsed.zoom === 'number') return parsed;
  } catch { /* ignore */ }
  return null;
}
