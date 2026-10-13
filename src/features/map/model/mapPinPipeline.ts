import { Business } from '../../../types';
import {
  createCompactActivityPinHtml,
  createCategoryClusterPinHtml,
  createLightweightClusterHtml,
} from '../badgeMarkers';
import { getCategoryPinStyle, getBusinessPinCategoryId } from '../markers/categoryPinStyle';
import { categoryPinKey, categoryPinLimitForZoom, categoryPinOffset, splitGroupByCategory } from '../utils/categoryPinGroups';
import { formatActivityCountLabel } from '../../../shared/lib/format';
import { escapeHtml } from './mapMarkerHtml';
import { MAP_ZOOM_POLICY } from '../../../utils/mapZoomPolicy';
import { scheduleProgressiveWork } from '../utils/progressiveWork';
import { buildVisiblePinPipeline, visiblePinClusterKey } from '../utils/visiblePinPipeline';
import { computeMarkerIconKey } from '../utils/markerReconciliation';

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
    sortedBusinesses,
    selectedBiz,
    effectiveSelectedZone,
    viewportSnapshot,
    cameraController,
    onSelectBusiness,
    onComplete,
  } = ctx;

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
  const clusterKey = visiblePinClusterKey;
  const pinLimit = categoryPinLimitForZoom(zoom);
  const showNeutralClusters = zoom < MAP_ZOOM_POLICY.citywideFilterBelow;

  // Below zoom 15 every cluster is one neutral count. Category colours appear once zoomed in.
  const nextCategoryPinKeys = new Set<string>();
  for (const group of visibleGroups) {
    if (group.length <= 1) continue;
    const groupKey = clusterKey(group);
    if (showNeutralClusters) {
      nextCategoryPinKeys.add(categoryPinKey(groupKey, 'neutral'));
      continue;
    }
    for (const sub of splitGroupByCategory(group, pinLimit)) nextCategoryPinKeys.add(categoryPinKey(groupKey, sub.categoryId));
  }

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
        onSelectBusiness(biz);
      });

      cardsLayer.addLayer(dotMarker);
      markersRegistry.set(biz.id, { marker: dotMarker, biz, iconKey });
    }
  }

  markersRegistry.forEach((entry, id) => {
    if (!nextIds.has(id)) {
      cardsLayer.removeLayer(entry.marker);
      markersRegistry.delete(id);
    }
  });

  clusterRegistry.forEach((marker, id) => {
    if (!nextCategoryPinKeys.has(id)) {
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

      if (group.length > 1 && showNeutralClusters) {
        const key = categoryPinKey(clusterKey(group), 'neutral');
        if (!clusterRegistry.has(key)) {
          const data = createLightweightClusterHtml(group.length);
          const marker = window.L.marker([lat, lng], {
            icon: window.L.divIcon({ className: 'custom-neutral-cluster', ...data }),
            pane: 'pinsPane',
            zIndexOffset: 500,
            title: String(group.length),
          });
          marker.on('click', () => {
            const points = group.map((biz) => [biz.lat, biz.lng]);
            cameraController?.request({ kind: 'flyToBounds', bounds: window.L.latLngBounds(points), options: { padding: [70, 70], maxZoom: Math.min(19, map.getZoom() + 2), duration: 0.5 } }, 'cluster');
          });
          clusterLayer.addLayer(marker);
          clusterRegistry.set(key, marker);
        }
        return;
      }

      if (group.length > 1) {
        const groupKey = clusterKey(group);
        const categorySubGroups = splitGroupByCategory(group, pinLimit);

        categorySubGroups.forEach((sub, index) => {
          const key = categoryPinKey(groupKey, sub.categoryId);
          if (clusterRegistry.has(key)) return;

          const members = sub.members;
          const style = getCategoryPinStyle(sub.categoryId);
          const { dx, rowOffset } = categoryPinOffset(index, categorySubGroups.length);
          const data = createCategoryClusterPinHtml(sub.categoryId, members.length, [dx, rowOffset]);
          const marker = window.L.marker([lat, lng], {
            icon: window.L.divIcon({ className: 'custom-district-cluster-pin', ...data }),
            pane: 'pinsPane',
            zIndexOffset: 600 + categorySubGroups.length - index,
            title: members.length > 1 ? `${style.label} (${members.length})` : style.label,
          });

          marker.on('click', () => {
            if (members.length === 1) {
              onSelectBusiness(members[0]);
              return;
            }
            const points = members.map((biz) => [biz.lat, biz.lng]);
            if (map.getZoom() < 19 && members.some((biz) => map.distance([lat, lng], [biz.lat, biz.lng]) > 3)) {
              cameraController?.request({ kind: 'flyToBounds', bounds: window.L.latLngBounds(points), options: { padding: [70, 70], maxZoom: Math.min(19, map.getZoom() + 2), duration: 0.5 } }, 'cluster');
            } else {
              const list = document.createElement('div');
              list.dir = 'rtl';
              list.style.cssText = 'max-height:260px;overflow-y:auto;min-width:210px;padding:8px 6px;font-family:Cairo,sans-serif;';
              const heading = document.createElement('div');
              heading.style.cssText = 'font-weight:800;font-size:12px;color:#0f172a;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;gap:6px;';
              heading.innerHTML = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${style.color};"></span><span>${escapeHtml(style.label)} (${members.length})</span>`;
              list.append(heading);
              members.forEach((biz) => {
                const item = document.createElement('button');
                item.type = 'button';
                item.style.cssText = 'display:flex;align-items:center;justify-content:space-between;width:100%;padding:8px 10px;text-align:right;border:none;border-radius:8px;cursor:pointer;background:#f8fafc;color:#1e293b;font-size:11px;font-weight:700;font-family:inherit;margin-bottom:4px;transition:background 0.15s ease;';
                item.textContent = biz.nameAr || biz.name || 'عرض النشاط';
                item.onmouseenter = () => { item.style.background = '#e2e8f0'; item.style.color = '#0f172a'; };
                item.onmouseleave = () => { item.style.background = '#f8fafc'; item.style.color = '#1e293b'; };
                item.onclick = () => { map.closePopup(); onSelectBusiness(biz); };
                list.append(item);
              });
              marker.bindPopup(list, { maxWidth: 280 }).openPopup();
            }
          });

          clusterLayer.addLayer(marker);
          clusterRegistry.set(key, marker);
        });
        return;
      }

      const biz = group[0];
      const layout = pipeline.layouts.get(biz.id);
      if (!layout) return;
      const cardScale = 1;
      const iconKey = computeMarkerIconKey(biz, 0, [0, 0], 'pindot') + (showName ? '_named' : '');
      const existing = markersRegistry.get(biz.id);

      if (existing && existing.iconKey === iconKey) {
        existing.biz = biz;
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
          const current = markersRegistry.get(biz.id)?.biz || biz;
          onSelectBusiness(current);
        });
        cardsLayer.addLayer(marker);
        markersRegistry.set(biz.id, { marker, biz, iconKey });
      }
    },
    onComplete
  );

  return cancelWork;
}
