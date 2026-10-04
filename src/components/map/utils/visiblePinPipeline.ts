import { Business } from '../../../types';
import { activityCardScale, groupNearbyActivities } from './spatialActivityGroups';
import { isLocalPinPresentationZoom } from '../../../utils/mapZoomPolicy';

export interface PinPoint { x: number; y: number }
export interface PinLayout {
  biz: Business;
  point: PinPoint;
  type: 'card' | 'dot';
  scale: number;
  width: number;
  height: number;
}

export interface VisiblePinPipelineResult {
  groups: Business[][];
  singletonIds: Set<string>;
  clusterKeys: Set<string>;
  layouts: Map<string, PinLayout>;
  isDistrictView: boolean;
  scale: number;
}

export const visiblePinClusterKey = (group: Business[]) =>
  group.map(b => `${b.id}:${b.lat}:${b.lng}:${b.nameAr}`).join('|');

const groupCenter = (group: Business[], point: (biz: Business) => PinPoint): PinPoint => {
  const lat = group.reduce((sum, b) => sum + b.lat, 0) / group.length;
  const lng = group.reduce((sum, b) => sum + b.lng, 0) / group.length;
  return point({ ...group[0], lat, lng });
};

/** Merge multi-member groups whose 48px badges would overlap on screen, so clusters never stack. */
function mergeOverlappingGroups(rawGroups: Business[][], point: (biz: Business) => PinPoint): Business[][] {
  const groups = rawGroups.map(g => [...g]);
  let merged = true;
  while (merged) {
    merged = false;
    for (let i = 0; i < groups.length && !merged; i++) {
      if (groups[i].length <= 1) continue;
      for (let j = i + 1; j < groups.length; j++) {
        if (groups[j].length <= 1) continue;
        const a = groupCenter(groups[i], point);
        const b = groupCenter(groups[j], point);
        if (Math.hypot(a.x - b.x, a.y - b.y) < 100) {
          groups[i] = [...groups[i], ...groups[j]];
          groups.splice(j, 1);
          merged = true;
          break;
        }
      }
    }
  }
  return groups;
}

/** One deterministic pipeline: source/filter output -> viewport cull -> groups -> marker presentation. */
export function buildVisiblePinPipeline(input: {
  businesses: Business[];
  selectedBusiness?: Business | null;
  selectedBusinessId?: string;
  contains: (lat: number, lng: number) => boolean;
  project: (biz: Business) => PinPoint;
  point: (biz: Business) => PinPoint;
  zoom: number;
  hasSelectedZone: boolean;
  groupRadius?: number;
}): VisiblePinPipelineResult {
  const scale = activityCardScale(input.zoom);
  const isDistrictView = input.hasSelectedZone || isLocalPinPresentationZoom(input.zoom);
  const selectedBusinessId = input.selectedBusiness?.id ?? input.selectedBusinessId;
  const candidates = input.businesses.filter(b => b.id !== selectedBusinessId && input.contains(b.lat, b.lng));
  const groups = mergeOverlappingGroups(groupNearbyActivities(candidates, input.project, input.groupRadius ?? 58), input.point);
  const clusterKeys = new Set(groups.filter(g => g.length > 1).map(visiblePinClusterKey));
  const prominent = new Set(candidates.slice(0, 3).map(b => b.id));
  const singletonIds = new Set<string>();
  const occupied: Array<{ x: number; y: number; width: number; height: number; cluster: boolean; reserved?: boolean }> = [];
  const placedDots: PinPoint[] = [];
  const layouts = new Map<string, PinLayout>();

  // Reserve the selected card's footprint first so nearby cards never render underneath it.
  if (input.selectedBusiness && input.contains(input.selectedBusiness.lat, input.selectedBusiness.lng)) {
    const selectedPoint = input.point(input.selectedBusiness);
    occupied.push({ x: selectedPoint.x, y: selectedPoint.y, width: 232, height: 72, cluster: false, reserved: true });
  }

  // Register every cluster footprint before placing cards so a card processed
  // earlier can never land on a cluster it has not seen yet.
  for (const group of groups) {
    if (group.length <= 1) continue;
    const p = groupCenter(group, input.point);
    occupied.push({ x: p.x, y: p.y, width: 48, height: 48, cluster: true });
  }

  for (const group of groups) {
    if (group.length > 1) continue;
    const biz = group[0];
    const p = input.point(biz);
    const cardWidth = (isDistrictView ? 184 : 224) * scale;
    const cardHeight = (isDistrictView ? 134 : 60) * scale;
    const overlaps = occupied.some(slot => {
      const cx = p.x, cy = p.y - cardHeight / 2;
      const ox = slot.x, oy = slot.cluster ? slot.y : slot.y - slot.height / 2;
      const halfW = slot.cluster ? cardWidth / 2 + 28 : (slot.width + cardWidth) / 2 + 10;
      const halfH = slot.cluster ? cardHeight / 2 + 28 : (slot.height + cardHeight) / 2 + 10;
      return Math.abs(ox - cx) < halfW && Math.abs(oy - cy) < halfH;
    });
    const type = overlaps || (!isDistrictView && !prominent.has(biz.id)) ? 'dot' : 'card';
    if (type === 'dot') {
      const dotHalfW = 20, dotHalfH = 26;
      const blocked = occupied.some(slot => {
        if (slot.reserved) return false;
        const ox = slot.x, oy = slot.cluster ? slot.y : slot.y - slot.height / 2;
        const halfW = slot.cluster ? 24 + dotHalfW : slot.width / 2 + dotHalfW;
        const halfH = slot.cluster ? 24 + dotHalfH : slot.height / 2 + dotHalfH;
        return Math.abs(ox - p.x) < halfW && Math.abs(oy - (p.y - 22)) < halfH;
      }) || placedDots.some(d => Math.abs(d.x - p.x) < 40 && Math.abs(d.y - p.y) < 44);
      if (blocked) continue; // collision-hidden: reappears when the camera spreads markers apart
      placedDots.push({ x: p.x, y: p.y });
    }
    const itemScale = type === 'dot' ? 1 : scale;
    layouts.set(biz.id, { biz, point: p, type, scale: itemScale, width: cardWidth, height: cardHeight });
    singletonIds.add(biz.id);
    if (type === 'card') occupied.push({ x: p.x, y: p.y, width: cardWidth, height: cardHeight, cluster: false });
  }

  return { groups, singletonIds, clusterKeys, layouts, isDistrictView, scale };
}
