import { Business } from '../../../types';
import { createCompactActivityPinHtml } from '../badgeMarkers';
import { getCategoryPinStyle, getBusinessPinCategoryId } from '../markers/categoryPinStyle';
import { MAP_ZOOM_POLICY } from '../../../utils/mapZoomPolicy';
import { scheduleProgressiveWork } from '../utils/progressiveWork';
import { buildVisiblePinPipeline } from '../utils/visiblePinPipeline';
import { computeMarkerIconKey } from '../utils/markerReconciliation';
import { getOrCreateSpiderfyManager, type SpiderfyManager } from '../utils/mapSpiderfier';

export interface PinPipelineContext {
  map: any;
  cardsLayer: any;
  clusterLayer: any;
  spiderfyLayer?: any;
  spiderfyManager?: SpiderfyManager | null;
  clusterRegistry: Map<string, any>;
  markersRegistry: Map<string, { marker: any; biz: Business; iconKey: string; onSelectBusiness?: (b: Business) => void }>;
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
    spiderfyLayer,
    clusterRegistry,
    markersRegistry,
    sortedBusinesses,
    selectedBiz,
    effectiveSelectedZone,
    viewportSnapshot,
    onSelectBusiness,
    onComplete,
  } = ctx;

  const spiderfyManager: SpiderfyManager | null =
    ctx.spiderfyManager !== undefined
      ? ctx.spiderfyManager
      : spiderfyLayer
        ? getOrCreateSpiderfyManager({ map, spiderfyLayer, onSelectBusiness })
        : null;
  spiderfyManager?.setOnSelectBusiness(onSelectBusiness);

  // Every pin is one real activity, scattered evenly over the map. With no type filter the visible
  // set is a diverse mix of all types; choosing a type narrows it to that type only.
  const zoom = viewportSnapshot?.zoom ?? map.getZoom();
  const snapshotBounds = viewportSnapshot?.bounds;
  const bounds = snapshotBounds
    ? window.L.latLngBounds([[snapshotBounds.south, snapshotBounds.west], [snapshotBounds.north, snapshotBounds.east]]).pad(0.2)
    : map.getBounds().pad(0.2);

  const pipeline = buildVisiblePinPipeline({
    businesses: sortedBusinesses,
    individual: true,
    selectedBusiness: selectedBiz,
    contains: (lat, lng) => bounds.contains([lat, lng]),
    project: (biz) => map.project([biz.lat, biz.lng], zoom),
    point: (biz) => map.latLngToContainerPoint([biz.lat, biz.lng]),
    zoom,
    hasSelectedZone: Boolean(effectiveSelectedZone && effectiveSelectedZone !== 'all' && effectiveSelectedZone.trim()),
  });

  const { groups: visibleGroups, singletonIds: nextIds } = pipeline;
  const showName = zoom >= MAP_ZOOM_POLICY.detailedActivityCardsFrom;

  // Subtle Background Dots: only render a calm, capped subset at close street zoom so user stays focused
  if (pipeline.backgroundBusinesses && zoom >= 16.5 && window.L?.canvas) {
    const canvasRenderer =
      (map as any)._dlCanvasRenderer ||
      ((map as any)._dlCanvasRenderer = window.L.canvas({ pane: 'pinsPane' }));

    const bgLimit = 30;
    const toRender = pipeline.backgroundBusinesses.slice(0, bgLimit);
    for (const biz of toRender) {
      nextIds.add(biz.id);
      const existing = markersRegistry.get(biz.id);
      const categoryId = getBusinessPinCategoryId(biz);
      const style = getCategoryPinStyle(categoryId);
      const iconKey = `canvas_dot_${categoryId}`;

      if (existing) {
        if (existing.iconKey === iconKey) {
          existing.biz = biz;
          existing.onSelectBusiness = onSelectBusiness;
          continue;
        } else {
          cardsLayer.removeLayer(existing.marker);
          markersRegistry.delete(biz.id);
        }
      }

      const dotMarker = window.L.circleMarker([biz.lat, biz.lng], {
        renderer: canvasRenderer,
        radius: 2.5,
        fillColor: style.color,
        fillOpacity: 0.7,
        color: '#ffffff',
        weight: 1,
        pane: 'pinsPane',
        interactive: true,
      });

      dotMarker.on('click', (e: any) => {
        e?.originalEvent?.stopPropagation?.();
        const entry = markersRegistry.get(biz.id);
        (entry?.onSelectBusiness || onSelectBusiness)(entry?.biz || biz);
      });

      cardsLayer.addLayer(dotMarker);
      markersRegistry.set(biz.id, { marker: dotMarker, biz, iconKey, onSelectBusiness });
    }
  }

  markersRegistry.forEach((entry, id) => {
    if (!nextIds.has(id)) {
      cardsLayer.removeLayer(entry.marker);
      markersRegistry.delete(id);
    }
  });

  // Clustered pins pattern is removed: collapse any active spiderfy and clear any legacy cluster markers.
  if (spiderfyManager?.isExpanded()) {
    spiderfyManager.collapse();
  }
  clusterRegistry.forEach((marker, id) => {
    clusterLayer?.removeLayer?.(marker);
    clusterRegistry.delete(id);
  });

  const cancelWork = scheduleProgressiveWork(
    visibleGroups,
    (group) => {
      const biz = group[0];
      if (!biz || !bounds.contains([biz.lat, biz.lng])) return;

      const layout = pipeline.layouts.get(biz.id);
      if (!layout) return;
      const cardScale = 1;
      const iconKey = computeMarkerIconKey(biz, 0, [0, 0], 'pindot') + (showName ? '_named' : '');
      const existing = markersRegistry.get(biz.id);

      if (existing && existing.iconKey === iconKey) {
        existing.biz = biz;
        existing.onSelectBusiness = onSelectBusiness;
        existing.marker.setLatLng([biz.lat, biz.lng]);
        return;
      }

      if (existing && typeof existing.marker.setIcon !== 'function') {
        cardsLayer.removeLayer(existing.marker);
        markersRegistry.delete(biz.id);
      }

      const data = createCompactActivityPinHtml(biz, false, false, undefined, [0, 0], showName);

      const icon = window.L.divIcon({
        className: 'custom-biz-pin',
        html: `<div style="transform:scale(${cardScale});transform-origin:top left">${data.html}</div>`,
        iconSize: data.iconSize.map((n: number) => n * cardScale),
        iconAnchor: data.iconAnchor.map((n: number) => n * cardScale),
      });

      const currentEntry = markersRegistry.get(biz.id);
      if (currentEntry) {
        currentEntry.biz = biz;
        currentEntry.onSelectBusiness = onSelectBusiness;
        currentEntry.marker.setLatLng([biz.lat, biz.lng]);
        if (currentEntry.iconKey !== iconKey) {
          currentEntry.marker.setIcon(icon);
          currentEntry.iconKey = iconKey;
        }
      } else {
        const marker = window.L.marker([biz.lat, biz.lng], {
          icon,
          pane: 'pinsPane',
          title: biz.nameAr || '',
          zIndexOffset: showName ? 180 : 100,
        });
        marker.on('click', (e: any) => {
          e?.originalEvent?.stopPropagation?.();
          const entry = markersRegistry.get(biz.id);
          (entry?.onSelectBusiness || onSelectBusiness)(entry?.biz || biz);
        });
        cardsLayer.addLayer(marker);
        markersRegistry.set(biz.id, { marker, biz, iconKey, onSelectBusiness });
      }
    },
    onComplete
  );

  return () => {
    cancelWork();
  };
}
