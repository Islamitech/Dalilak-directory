import { Business } from '../../../types';
import { createCompactActivityPinHtml } from '../badgeMarkers';

export interface SpiderfyOffset {
  angle: number;
  radiusPx: number;
  dx: number;
  dy: number;
}

/**
 * Calculates radial/concentric layout pixel offsets for a cluster of pins.
 */
export function computeSpiderfyOffsets(count: number, baseRadius: number = 55): SpiderfyOffset[] {
  if (count <= 0) return [];
  if (count === 1) {
    return [{ angle: 0, radiusPx: 0, dx: 0, dy: 0 }];
  }

  // Up to 8 items: single balanced ring
  if (count <= 8) {
    const radiusPx = count <= 4 ? baseRadius : baseRadius + 12;
    const angleStep = (2 * Math.PI) / count;
    const startAngle = -Math.PI / 2;
    return Array.from({ length: count }, (_, i) => {
      const angle = startAngle + i * angleStep;
      return {
        angle,
        radiusPx,
        dx: Math.round(Math.cos(angle) * radiusPx),
        dy: Math.round(Math.sin(angle) * radiusPx),
      };
    });
  }

  // More than 8 items: 2 concentric rings
  const ring1Count = Math.min(6, Math.floor(count * 0.4));
  const ring2Count = count - ring1Count;

  const offsets: SpiderfyOffset[] = [];
  const ring1Radius = baseRadius;
  const ring1Step = (2 * Math.PI) / ring1Count;
  const startAngle1 = -Math.PI / 2;

  for (let i = 0; i < ring1Count; i++) {
    const angle = startAngle1 + i * ring1Step;
    offsets.push({
      angle,
      radiusPx: ring1Radius,
      dx: Math.round(Math.cos(angle) * ring1Radius),
      dy: Math.round(Math.sin(angle) * ring1Radius),
    });
  }

  const ring2Radius = baseRadius + 45;
  const ring2Step = (2 * Math.PI) / ring2Count;
  const startAngle2 = startAngle1 + ring2Step / 2;

  for (let i = 0; i < ring2Count; i++) {
    const angle = startAngle2 + i * ring2Step;
    offsets.push({
      angle,
      radiusPx: ring2Radius,
      dx: Math.round(Math.cos(angle) * ring2Radius),
      dy: Math.round(Math.sin(angle) * ring2Radius),
    });
  }

  return offsets;
}

export interface SpiderfyManagerOptions {
  map: any;
  spiderfyLayer: any;
  onSelectBusiness: (biz: Business) => void;
}

export interface SpiderfyManager {
  expand: (center: [number, number], members: Business[], clusterKey: string) => void;
  collapse: () => void;
  isExpanded: () => boolean;
  getActiveClusterKey: () => string | null;
  setOnSelectBusiness: (cb: (biz: Business) => void) => void;
  destroy: () => void;
}

/**
 * Creates an animated Spiderfy manager that manages the lifecycle of expanded clusters.
 */
export function createSpiderfyManager(options: SpiderfyManagerOptions): SpiderfyManager {
  const { map, spiderfyLayer } = options;
  let currentOnSelectBusiness = options.onSelectBusiness;
  let activeClusterKey: string | null = null;
  let listenersAttached = false;

  const collapse = (options?: { animated?: boolean }) => {
    if (!activeClusterKey && !listenersAttached) return;
    activeClusterKey = null;
    detachListeners();
    if (!spiderfyLayer) return;

    if ((spiderfyLayer as any).__dlActiveSpiderfy === manager) {
      (spiderfyLayer as any).__dlActiveSpiderfy = null;
    }

    const animated = options?.animated ?? false;
    const pane = spiderfyLayer.getPane ? spiderfyLayer.getPane() : null;
    const items = pane ? pane.querySelectorAll('.spiderfy-pin-entry, .spiderfy-center-anchor') : null;

    if (animated && items && items.length > 0) {
      items.forEach((el: any) => {
        el.style.transition = 'opacity 0.16s ease-out, transform 0.16s cubic-bezier(0.4, 0, 0.2, 1)';
        el.style.opacity = '0';
        el.style.transform = 'scale(0.35)';
      });
      setTimeout(() => {
        if (!activeClusterKey && spiderfyLayer) {
          spiderfyLayer.clearLayers();
        }
      }, 160);
    } else {
      spiderfyLayer.clearLayers();
    }
  };

  const onDismiss = () => {
    collapse({ animated: true });
  };

  const attachListeners = () => {
    if (listenersAttached || !map) return;
    map.on('click', onDismiss);
    map.on('zoomstart', onDismiss);
    map.on('movestart', onDismiss);
    listenersAttached = true;
  };

  const detachListeners = () => {
    if (!listenersAttached || !map) return;
    map.off('click', onDismiss);
    map.off('zoomstart', onDismiss);
    map.off('movestart', onDismiss);
    listenersAttached = false;
  };

  const expand = (center: [number, number], members: Business[], clusterKey: string) => {
    const L = typeof window !== 'undefined' ? (window as any).L : (globalThis as any).L;
    if (!map || !spiderfyLayer || !L || members.length === 0) return;

    // If another manager was active on the same spiderfyLayer, collapse it first to avoid orphaned listeners
    const prevActive: SpiderfyManager | undefined = (spiderfyLayer as any).__dlActiveSpiderfy;
    if (prevActive && prevActive !== manager) {
      prevActive.collapse();
    }

    // Toggle collapse if clicking the same active cluster
    if (activeClusterKey === clusterKey) {
      collapse();
      return;
    }

    collapse();
    activeClusterKey = clusterKey;
    (spiderfyLayer as any).__dlActiveSpiderfy = manager;

    const zoom = map.getZoom();
    const offsets = computeSpiderfyOffsets(members.length);
    const centerPoint = map.project(center, zoom);

    // Center anchor dot
    const centerAnchorIcon = L.divIcon({
      className: 'spiderfy-center-anchor',
      html: '<div style="width:16px;height:16px;border-radius:50%;background:#0284c7;border:2.5px solid #ffffff;box-shadow:0 0 0 2px rgba(2,132,199,0.35),0 2px 4px rgba(0,0,0,0.25);cursor:pointer;" title="إغلاق التفكيك"></div>',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
    const centerMarker = L.marker(center, {
      icon: centerAnchorIcon,
      pane: 'spiderfyPane',
      zIndexOffset: 999,
    });
    centerMarker.on('click', (e: any) => {
      e?.originalEvent?.stopPropagation?.();
      collapse();
    });
    spiderfyLayer.addLayer(centerMarker);

    // Render connecting lines and spiderfied pins
    members.forEach((biz, index) => {
      const offset = offsets[index] || { dx: 0, dy: 0 };
      const targetPoint = centerPoint.add(L.point(offset.dx, offset.dy));
      const targetLatLng = map.unproject(targetPoint, zoom);

      // Connecting line
      const line = L.polyline(
        [center, [targetLatLng.lat, targetLatLng.lng]],
        {
          color: '#64748b',
          weight: 1.5,
          dashArray: '3, 4',
          opacity: 0.85,
          interactive: false,
          pane: 'spiderfyPane',
        }
      );
      spiderfyLayer.addLayer(line);

      // Spiderfied compact pin with name
      const data = createCompactActivityPinHtml(biz, false, false, undefined, [0, 0], true);
      const icon = L.divIcon({
        className: 'custom-biz-pin spiderfy-pin-entry',
        html: `<div style="animation:spiderfy-pop 0.22s cubic-bezier(0.34,1.56,0.64,1) both;">${data.html}</div>`,
        iconSize: data.iconSize,
        iconAnchor: data.iconAnchor,
      });

      const pinMarker = L.marker([targetLatLng.lat, targetLatLng.lng], {
        icon,
        pane: 'spiderfyPane',
        title: biz.nameAr || '',
        zIndexOffset: 1200 + index,
      });

      pinMarker.on('click', (e: any) => {
        e?.originalEvent?.stopPropagation?.();
        collapse();
        currentOnSelectBusiness(biz);
      });

      spiderfyLayer.addLayer(pinMarker);
    });

    attachListeners();
  };

  const setOnSelectBusiness = (cb: (biz: Business) => void) => {
    currentOnSelectBusiness = cb;
  };

  const destroy = () => {
    collapse();
    if (spiderfyLayer && (spiderfyLayer as any).__dlSpiderfyManager === manager) {
      delete (spiderfyLayer as any).__dlSpiderfyManager;
    }
  };

  const manager: SpiderfyManager = {
    expand,
    collapse,
    isExpanded: () => Boolean(activeClusterKey),
    getActiveClusterKey: () => activeClusterKey,
    setOnSelectBusiness,
    destroy,
  };

  return manager;
}

/**
 * Reuses a single SpiderfyManager per spiderfyLayer (and map instance) across pipeline runs
 * so retained cluster markers in clusterRegistry never hold stale/destroyed manager references.
 */
export function getOrCreateSpiderfyManager(options: SpiderfyManagerOptions): SpiderfyManager {
  const { map, spiderfyLayer, onSelectBusiness } = options;
  if (spiderfyLayer) {
    const existing = (spiderfyLayer as any).__dlSpiderfyManager as
      | (SpiderfyManager & { __dlMap?: any })
      | undefined;
    if (existing && existing.__dlMap === map) {
      existing.setOnSelectBusiness(onSelectBusiness);
      return existing;
    }
    existing?.destroy();
  }
  const manager = createSpiderfyManager(options) as SpiderfyManager & { __dlMap?: any };
  manager.__dlMap = map;
  if (spiderfyLayer) {
    (spiderfyLayer as any).__dlSpiderfyManager = manager;
  }
  return manager;
}
