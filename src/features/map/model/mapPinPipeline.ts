import { Business } from '../../../types';
import {
  createCompactActivityPinHtml,
  createCategoryClusterPinHtml,
} from '../../../components/map/badgeMarkers';
import { getCategoryPinStyle } from '../../../components/map/markers/categoryPinStyle';
import { categoryPinKey, categoryPinLimitForZoom, categoryPinOffset, splitGroupByCategory } from '../../../components/map/utils/categoryPinGroups';
import { formatActivityCountLabel } from '../../../shared/lib/format';
import { MAP_ZOOM_POLICY } from '../../../utils/mapZoomPolicy';
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

  // One registry entry per (cluster, category) pin.
  const nextCategoryPinKeys = new Set<string>();
  for (const group of visibleGroups) {
    if (group.length <= 1) continue;
    const groupKey = clusterKey(group);
    for (const sub of splitGroupByCategory(group, pinLimit)) nextCategoryPinKeys.add(categoryPinKey(groupKey, sub.categoryId));
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
              list.style.cssText = 'max-height:240px;overflow:auto;min-width:190px';
              const heading = document.createElement('strong');
              heading.textContent = `${style.label}: ${members.length} ${formatActivityCountLabel(members.length)} في هذا المكان`;
              list.append(heading);
              members.forEach((biz) => {
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

      const data = createCompactActivityPinHtml(biz, false, false, undefined, [0, 0], showName);

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
        }
      } else {
        const marker = window.L.marker([biz.lat, biz.lng], {
          icon,
          pane: 'pinsPane',
          title: biz.nameAr || '',
          zIndexOffset: showName ? 180 : 100,
        });
        marker.on('click', () => {
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
