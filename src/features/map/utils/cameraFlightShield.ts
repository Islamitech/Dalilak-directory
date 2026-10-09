// Cinematic camera-flight shield (registry docs 18 + 19).
// Freezes district SVG transitions while a flight is airborne and through any chained
// camera move that follows the first moveend (e.g. overview flyTo -> panTo), so nothing
// animates mid-flight (zero-jitter landing). Token invalidation makes a newer flight
// supersede older listeners instantly: stray moveend events emitted by Leaflet's zoom
// snap during map.stop() can no longer release a freshly armed shield.

export interface CameraShieldState {
  settlingTimer: number | null;
  armTimer: number | null;
  token: number;
  onMoveEnd: (() => void) | null;
}

export function createCameraShieldState(): CameraShieldState {
  return { settlingTimer: null, armTimer: null, token: 0, onMoveEnd: null };
}

const SETTLING_RELEASE_MS = 180;
const ARM_DEADLINE_MS = 6000;
const WATCH_DEADLINE_MS = 5000;
const STABLE_FRAMES_REQUIRED = 2;
const ZOOM_EPSILON = 1e-9;
const COORD_EPSILON = 1e-12;

export function markCameraFlight(map: any, state: CameraShieldState): void {
  const container = map?.getContainer?.();
  if (!container) return;

  const token = ++state.token;
  if (state.onMoveEnd) {
    map.off?.('moveend', state.onMoveEnd);
    state.onMoveEnd = null;
  }
  if (state.settlingTimer !== null) {
    window.clearTimeout(state.settlingTimer);
    state.settlingTimer = null;
  }
  if (state.armTimer !== null) window.clearTimeout(state.armTimer);

  container.classList.remove('is-camera-settling');
  container.classList.add('is-camera-flying');

  const release = () => {
    if (token !== state.token) return;
    if (state.armTimer !== null) {
      window.clearTimeout(state.armTimer);
      state.armTimer = null;
    }
    container.classList.remove('is-camera-flying');
    container.classList.add('is-camera-settling');
    if (state.settlingTimer !== null) window.clearTimeout(state.settlingTimer);
    state.settlingTimer = window.setTimeout(() => {
      container.classList.remove('is-camera-settling');
      state.settlingTimer = null;
    }, SETTLING_RELEASE_MS);
  };

  // Backstop for flights that stop without a moveend (gesture cancel / request throw).
  state.armTimer = window.setTimeout(release, ARM_DEADLINE_MS);

  let deadline = Number.POSITIVE_INFINITY;
  let prevZoom = Number.NaN;
  let prevLat = Number.NaN;
  let prevLng = Number.NaN;
  let stableFrames = 0;

  const check = () => {
    if (token !== state.token) return;
    let zoom: number;
    let lat: number;
    let lng: number;
    try {
      zoom = map.getZoom();
      const center = map.getCenter();
      lat = center.lat;
      lng = center.lng;
    } catch {
      release();
      return;
    }
    const stable =
      Math.abs(zoom - prevZoom) < ZOOM_EPSILON &&
      Math.abs(lat - prevLat) < COORD_EPSILON &&
      Math.abs(lng - prevLng) < COORD_EPSILON;
    stableFrames = stable ? stableFrames + 1 : 0;
    prevZoom = zoom;
    prevLat = lat;
    prevLng = lng;
    if (stableFrames >= STABLE_FRAMES_REQUIRED || performance.now() > deadline) {
      release();
      return;
    }
    requestAnimationFrame(check);
  };

  const onMoveEnd = () => {
    if (token !== state.token) return;
    try {
      prevZoom = map.getZoom();
      const center = map.getCenter();
      prevLat = center.lat;
      prevLng = center.lng;
    } catch {
      release();
      return;
    }
    stableFrames = 0;
    deadline = performance.now() + WATCH_DEADLINE_MS;
    requestAnimationFrame(check);
  };
  state.onMoveEnd = onMoveEnd;
  map.once('moveend', onMoveEnd);
}

export function disposeCameraShield(map: any, state: CameraShieldState): void {
  state.token += 1;
  if (state.onMoveEnd) {
    map?.off?.('moveend', state.onMoveEnd);
    state.onMoveEnd = null;
  }
  if (state.settlingTimer !== null) {
    window.clearTimeout(state.settlingTimer);
    state.settlingTimer = null;
  }
  if (state.armTimer !== null) {
    window.clearTimeout(state.armTimer);
    state.armTimer = null;
  }
  const container = map?.getContainer?.();
  container?.classList.remove('is-camera-flying', 'is-camera-settling');
}
