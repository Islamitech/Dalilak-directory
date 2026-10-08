import { isBusinessSelectionOverviewZoom, isZoneCameraTransitionZoom } from '../../../utils/mapZoomPolicy';

/**
 * 🎥 Single Camera Movement Coordinator & Decision Engine
 * 
 * Central authoritative planner determining if and when camera movements are permitted.
 * Implements world-class cinematic camera choreography:
 * 1. Category changes trigger ZERO camera transitions.
 * 2. Zone selection calculates intelligent flight mode:
 *    - 'parabolic-arc': Two-phase flight (lift-off zoom-out + descent glide) when already zoomed in.
 *    - 'direct-glide': Smooth direct glide with ample easing when coming from city overview.
 * 3. Clearing zone triggers a smooth transition back to Hadayek general overview.
 * 4. Selecting a business respects city overview scale:
 *    - At overview scale (zoom <= 15.0), gently pans without high-zoom slam, keeping the city visible (State 1).
 *    - Deep zoom (zoom 17.5) is reserved for when user taps the card to expand (State 2).
 */

export interface CameraTransitionDecision {
  shouldMove: boolean;
  type?: 'zone' | 'overview' | 'business';
  flightMode?: 'parabolic-arc' | 'direct-glide' | 'pan-center';
  targetBounds?: [number, number][];
  targetCenter?: [number, number];
  targetZoom?: number;
  phase1Duration?: number;
  phase2Duration?: number;
  totalDuration?: number;
  overviewZoom?: number;
  reason: string;
}

export function planCameraTransitionOnZoneChange(
  previousZone: string,
  newZone: string,
  districts?: Array<{ letterAr: string; polygons: [number, number][][] }>,
  currentZoom?: number
): CameraTransitionDecision {
  const normPrev = (previousZone || '').trim();
  const normNext = (newZone || '').trim();

  // Repeating the same zone triggers ZERO transitions
  if (normPrev === normNext) {
    return {
      shouldMove: false,
      reason: 'Zone unchanged; camera remains stable.',
    };
  }

  // Zone selected
  if (normNext !== '') {
    const targetDistrict = districts?.find((d) => d.letterAr === normNext);
    // Frame every ring belonging to the district. Using only the first ring
    // makes multi-part areas look visually shifted after selection.
    const bounds = targetDistrict?.polygons?.flat();

    // Check if camera is currently zoomed into a local area (>= 15.0) and switching zones
    const isZoomedIn = isZoneCameraTransitionZoom(currentZoom);
    const isSwitchingZones = normPrev !== '' && normPrev !== normNext;

    const flightMode: 'parabolic-arc' | 'direct-glide' = isZoomedIn || isSwitchingZones ? 'parabolic-arc' : 'direct-glide';

    return {
      shouldMove: true,
      type: 'zone',
      flightMode,
      targetBounds: bounds,
      overviewZoom: 14.0,
      phase1Duration: 0.45,
      phase2Duration: 0.75,
      totalDuration: flightMode === 'parabolic-arc' ? 1.2 : 1.15,
      reason: `Zone changed from "${normPrev}" to "${normNext}"; using ${flightMode} transition.`,
    };
  }

  // Zone cleared -> Return to Hadayek overview
  return {
    shouldMove: true,
    type: 'overview',
    flightMode: 'direct-glide',
    targetCenter: [29.9683, 31.1002],
    targetZoom: 14,
    totalDuration: 1.1,
    reason: `Zone cleared; returning camera to Hadayek general overview.`,
  };
}

export function planCameraTransitionOnCategoryChange(
  previousCategory: string,
  newCategory: string
): CameraTransitionDecision {
  // Category change updates pins and cards only; ZERO camera movement
  return {
    shouldMove: false,
    reason: 'Category filter change must never move camera.',
  };
}

export function planCameraTransitionOnBusinessSelect(
  previousBizId: string | null,
  newBizId: string | null,
  bizCoords?: { lat: number; lng: number },
  currentZoom?: number,
  isExpandedOnMap?: boolean
): CameraTransitionDecision {
  if (!newBizId || newBizId === previousBizId) {
    return {
      shouldMove: false,
      reason: 'No business selected or selection unchanged.',
    };
  }

  if (
    bizCoords &&
    Number.isFinite(bizCoords.lat) &&
    Number.isFinite(bizCoords.lng) &&
    (Math.abs(bizCoords.lat) > 0.0001 || Math.abs(bizCoords.lng) > 0.0001)
  ) {
    // If card is already expanded on map (State 2), perform deep street zoom
    if (isExpandedOnMap) {
      return {
        shouldMove: true,
        type: 'business',
        flightMode: 'direct-glide',
        targetCenter: [bizCoords.lat, bizCoords.lng],
        targetZoom: 17.5,
        totalDuration: 0.65,
        reason: `Diving into expanded street view for business ${newBizId}.`,
      };
    }

    // In State 1 (Compact card selection):
    // If camera is currently at city overview scale (currentZoom <= 15.0),
    // KEEP the overview scale so the whole city remains visible!
    const isOverview = isBusinessSelectionOverviewZoom(currentZoom);
    const zoomToUse = isOverview ? currentZoom : Math.max(currentZoom || 16.5, 16.5);

    return {
      shouldMove: true,
      type: 'business',
      flightMode: isOverview ? 'pan-center' : 'direct-glide',
      targetCenter: [bizCoords.lat, bizCoords.lng],
      targetZoom: zoomToUse,
      totalDuration: isOverview ? 0.6 : 0.7,
      reason: isOverview
        ? `Centering in city overview without deep zoom for business ${newBizId}.`
        : `Centering on newly selected business ${newBizId}.`,
    };
  }

  return {
    shouldMove: false,
    reason: 'Business coordinates missing.',
  };
}

/** Matches the expanded activity card in badgeMarkers (photo 100 + body 155 + pointer 9). */
export const EXPANDED_ACTIVITY_CARD_HEIGHT = 264;

/**
 * Pixels to move the selected pin down from the viewport center so the card
 * stays below the filter bar and above the bottom controls.
 * Positive means the pin sits lower on screen than the center.
 */
export function selectedCardCameraShiftY(
  viewportHeight: number,
  topChromePx: number,
  bottomChromePx = 64,
  cardHeight = EXPANDED_ACTIVITY_CARD_HEIGHT,
): number {
  const centerY = viewportHeight / 2;
  const maxPinY = viewportHeight - bottomChromePx;
  let pinY = centerY;
  if (centerY - cardHeight < topChromePx) pinY = topChromePx + cardHeight;
  if (pinY > maxPinY) pinY = maxPinY;
  return Math.round(pinY - centerY);
}

export function readMapTopChromePx(map: any): number {
  try {
    const container: HTMLElement | null = map?.getContainer?.() ?? null;
    const bar = container?.parentElement?.querySelector('[data-map-top-bar]') as HTMLElement | null;
    if (!container || !bar) return 76;
    const top = bar.getBoundingClientRect().bottom - container.getBoundingClientRect().top;
    return Math.max(56, Math.round(top) + 10);
  } catch {
    return 76;
  }
}

export function flyCameraToSelectedBusiness(
  map: any,
  cameraController: { request: (command: unknown, priority: string) => boolean } | null | undefined,
  biz: { id: string; lat: number; lng: number },
): void {
  const decision = planCameraTransitionOnBusinessSelect(null, biz.id, { lat: biz.lat, lng: biz.lng }, map.getZoom(), true);
  if (!decision.shouldMove || !decision.targetCenter) return;
  const targetZoom = decision.targetZoom ?? map.getZoom();
  const viewport = map.getSize();
  const shiftY = selectedCardCameraShiftY(viewport.y, readMapTopChromePx(map));
  const centerWorld = map.project(decision.targetCenter, targetZoom).subtract([0, shiftY]);
  const center = map.unproject(centerWorld, targetZoom);
  cameraController?.request(
    { kind: 'flyTo', center: [center.lat, center.lng], zoom: targetZoom, options: { duration: decision.totalDuration ?? 0.65 } },
    'selection',
  );
}

/** Runs `run` once the current camera flight has landed (or after a safety timeout). Returns a cleanup. */
export function runAfterCameraSettles(map: any, run: () => void, fallbackMs = 3200): () => void {
  let done = false;
  let settleTimer: number | undefined;
  const settle = () => {
    if (done) return;
    done = true;
    map.off?.('moveend', settle);
    settleTimer = window.setTimeout(run, 160);
  };
  map.once?.('moveend', settle);
  const fallback = window.setTimeout(settle, fallbackMs);
  return () => {
    done = true;
    map.off?.('moveend', settle);
    window.clearTimeout(fallback);
    if (settleTimer) window.clearTimeout(settleTimer);
  };
}
/** Nudges the map if the open card still covers the filter bar after the flight. */
export function panSelectedCardBelowChrome(
  map: any,
  cameraController: { request: (command: unknown, priority: string) => boolean } | null | undefined,
): void {
  const container: HTMLElement | null = map?.getContainer?.() ?? null;
  const card = container?.querySelector('.selected-expanded-pin') as HTMLElement | null;
  const bar = container?.parentElement?.querySelector('[data-map-top-bar]') as HTMLElement | null;
  if (!container || !card || !bar) return;
  const overlap = bar.getBoundingClientRect().bottom + 10 - card.getBoundingClientRect().top;
  if (overlap < 24) return;
  cameraController?.request(
    { kind: 'panBy', offset: [0, -Math.round(overlap)], options: { duration: 0.6 } },
    'selection',
  );
}

/**
 * Calculates asymmetric viewport padding to ensure visual center is not obscured
 * by the floating top search bar or bottom detail drawers.
 */
export function getVisualViewportPadding(
  isMobile: boolean,
  hasBottomDrawer: boolean
): { paddingTopLeft: [number, number]; paddingBottomRight: [number, number] } {
  if (isMobile) {
    return {
      paddingTopLeft: [20, 95], // Room for floating search bar [x, y]
      paddingBottomRight: [20, hasBottomDrawer ? 165 : 45], // Room for bottom drawer [x, y]
    };
  }
  return {
    paddingTopLeft: [40, 90],
    paddingBottomRight: [50, 40],
  };
}
