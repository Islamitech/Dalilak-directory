import { Business } from '../../../types';
import {
  createLightweightBadgeHtml,
  createCompactOverviewBadgeHtml,
  createCompactActivityPinHtml,
  createLightweightClusterHtml,
  attachCardDomListeners,
} from '../../../components/map/badgeMarkers';
import { scheduleProgressiveWork } from '../../../components/map/utils/progressiveWork';
import { buildVisiblePinPipeline, visiblePinClusterKey } from '../../../components/map/utils/visiblePinPipeline';
import { computeMarkerIconKey } from '../../../components/map/utils/markerReconciliation';

export interface PinPipelineContext {
  map: any;
  cardsLayer: any;
  clusterLayer: any;
  clusterRegistry: Map<string, any>;
  markersRegistry: Map<string, { marker: any; biz: Business; iconKey: string }>;
  seenMarkers: Set<string>;
  sortedBusinesses: Business[];
  selectedBiz: Business | null;
  effectiveCategoryFilter?: string;
  effectiveSelectedZone?: string;
  searchQuery?: string;
  viewportSnapshot?: any;
  cameraController: any;
  onSelectBusiness: (b: Business) => void;
  onComplete: () => void;
}

export function executePinPipeline(ctx: PinPipelineContext): () => void {
  const {
    map,
    cardsLayer,
    clusterLayer,
    clusterRegistry,
    markersRegistry,
    seenMarkers,
    sortedBusinesses,
    selectedBiz,
    effectiveCategoryFilter,
    effectiveSelectedZone,
    searchQuery,
    viewportSnapshot,
    cameraController,
    onSelectBusiness,
    onComplete,
  } = ctx;

  const hasCategoryFilter = Boolean(effectiveCategoryFilter && effectiveCategoryFilter !== 'all' && effectiveCategoryFilter.trim() !== '');
  const hasSearchOverride = Boolean(searchQuery && searchQuery.trim() !== '' && sortedBusinesses.length > 0);

  if (selectedBiz) {
    markersRegistry.forEach((entry) => {
      cardsLayer.removeLayer(entry.marker);
    });
    markersRegistry.clear();
    cardsLayer.clearLayers();
    clusterLayer.clearLayers();
    clusterRegistry.clear();
    onComplete();
    return () => {};
  }

  if (!hasCategoryFilter && !hasSearchOverride) {
    cardsLayer.clearLayers();
    clusterLayer.clearLayers();
    clusterRegistry.clear();
    markersRegistry.clear();
    onComplete();
    return () => {};
  }

  const zoom = viewportSnapshot?.zoom ?? map.getZoom();
  const snapshotBounds = viewportSnapshot?.bounds;
  const bounds = snapshotBounds
    ? window.L.latLngBounds([[snapshotBounds.south, snapshotBounds.west], [snapshotBounds.north, snapshotBounds.east]]).pad(0.2)
    : map.getBounds().pad(0.2);

  const pipeline = buildVisiblePinPipeline({
    businesses: sortedBusinesses,
    selectedBusiness: selectedBiz,
    contains: (lat, lng) => bounds.contains([lat, lng]),
    project: (biz) => map.project([biz.lat, biz.lng], zoom),
    point: (biz) => map.latLngToContainerPoint([biz.lat, biz.lng]),
    zoom,
    hasSelectedZone: Boolean(effectiveSelectedZone && effectiveSelectedZone !== 'all' && effectiveSelectedZone.trim()),
  });

  const { groups: visibleGroups, singletonIds: nextIds, clusterKeys: nextClusters, isDistrictView } = pipeline;
  const clusterKey = visiblePinClusterKey;

  markersRegistry.forEach((entry, id) => {
    if (!nextIds.has(id)) {
      cardsLayer.removeLayer(entry.marker);
      markersRegistry.delete(id);
    }
  });

  clusterRegistry.forEach((marker, id) => {
    if (!nextClusters.has(id)) {
      clusterLayer.removeLayer(marker);
      clusterRegistry.delete(id);
    }
  });

  let staggerIndex = 0;

  const cancelWork = scheduleProgressiveWork(
    visibleGroups,
    (group) => {
      const lat = group.reduce((sum, biz) => sum + biz.lat, 0) / group.length;
      const lng = group.reduce((sum, biz) => sum + biz.lng, 0) / group.length;
      if (!bounds.contains([lat, lng])) return;

      if (group.length > 1) {
        const key = clusterKey(group);
        if (clusterRegistry.has(key)) return;
        const data = createLightweightClusterHtml(group.length);
        const marker = window.L.marker([lat, lng], {
          icon: window.L.divIcon({ className: 'custom-district-cluster-pin', ...data }),
          pane: 'pinsPane',
          zIndexOffset: 600,
          title: `${group.length} أنشطة متقاربة`,
        });

        marker.on('click', () => {
          const points = group.map((biz) => [biz.lat, biz.lng]);
          if (map.getZoom() < 19 && group.some((biz) => map.distance([lat, lng], [biz.lat, biz.lng]) > 3)) {
            cameraController?.request({ kind: 'flyToBounds', bounds: window.L.latLngBounds(points), options: { padding: [70, 70], maxZoom: Math.min(19, map.getZoom() + 2), duration: 0.5 } }, 'cluster');
          } else {
            const list = document.createElement('div');
            list.dir = 'rtl';
            list.style.cssText = 'max-height:240px;overflow:auto;min-width:190px';
            const heading = document.createElement('strong');
            heading.textContent = `${group.length} أنشطة في هذا المكان`;
            list.append(heading);
            group.forEach((biz) => {
              const button = document.createElement('button');
              button.type = 'button';
              button.textContent = biz.nameAr || biz.name || 'عرض النشاط';
              button.style.cssText = 'display:block;width:100%;padding:12px;text-align:right;border-bottom:1px solid #eee;cursor:pointer;background:white;color:#0f172a';
              button.onclick = () => { map.closePopup(); onSelectBusiness(biz); };
              list.append(button);
            });
            marker.bindPopup(list).openPopup();
          }
        });

        clusterLayer.addLayer(marker);
        clusterRegistry.set(key, marker);
        return;
      }

      const biz = group[0];
      const layout = pipeline.layouts.get(biz.id);
      if (!layout) return;
      const usePinDot = layout.type === 'dot';
      const cardScale = layout.scale;
      const markerType = usePinDot ? 'pindot' : isDistrictView ? 'district' : 'overview';
      const iconKey = computeMarkerIconKey(biz, 0, [0, 0], markerType) + `_${cardScale}`;
      const existing = markersRegistry.get(biz.id);

      if (existing && existing.iconKey === iconKey) {
        existing.biz = biz;
        existing.marker.setLatLng([biz.lat, biz.lng]);
        return;
      }

      const data = usePinDot
        ? createCompactActivityPinHtml(biz, false, false)
        : isDistrictView
        ? createLightweightBadgeHtml(biz, false, false)
        : createCompactOverviewBadgeHtml(biz, false);

      const icon = window.L.divIcon({
        className: 'custom-biz-pin',
        html: `<div style="transform:scale(${cardScale});transform-origin:top left">${data.html}</div>`,
        iconSize: data.iconSize.map((n: number) => n * cardScale),
        iconAnchor: data.iconAnchor.map((n: number) => n * cardScale),
      });

      if (existing) {
        existing.biz = biz;
        existing.marker.setLatLng([biz.lat, biz.lng]);
        if (existing.iconKey !== iconKey) {
          existing.marker.setIcon(icon);
          existing.iconKey = iconKey;
          if ('fallbackCover' in data && typeof data.fallbackCover === 'string') {
            attachCardDomListeners(existing.marker, data.fallbackCover);
          }
        }
      } else {
        const marker = window.L.marker([biz.lat, biz.lng], {
          icon,
          pane: 'pinsPane',
          title: biz.nameAr || '',
          zIndexOffset: usePinDot ? 100 : 300,
        });
        marker.on('click', () => {
          const current = markersRegistry.get(biz.id)?.biz || biz;
          onSelectBusiness(current);
        });
        cardsLayer.addLayer(marker);
        if ('fallbackCover' in data && typeof data.fallbackCover === 'string') {
          attachCardDomListeners(marker, data.fallbackCover);
        }
        markersRegistry.set(biz.id, { marker, biz, iconKey });
      }
    },
    onComplete
  );

  return cancelWork;
}
