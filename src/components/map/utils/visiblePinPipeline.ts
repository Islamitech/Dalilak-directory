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
  const groups = groupNearbyActivities(candidates, input.project, input.groupRadius ?? 58);
  const singletonIds = new Set(groups.filter(g => g.length === 1).map(g => g[0].id));
  const clusterKeys = new Set(groups.filter(g => g.length > 1).map(visiblePinClusterKey));
  const prominent = new Set(candidates.slice(0, 3).map(b => b.id));
  const occupied: Array<{ x: number; y: number; width: number; height: number; cluster: boolean }> = [];
  const layouts = new Map<string, PinLayout>();

  // Reserve the selected card's footprint first so nearby cards never render underneath it.
  if (input.selectedBusiness && input.contains(input.selectedBusiness.lat, input.selectedBusiness.lng)) {
    const selectedPoint = input.point(input.selectedBusiness);
    occupied.push({ x: selectedPoint.x, y: selectedPoint.y, width: 232, height: 72, cluster: false });
  }

  for (const group of groups) {
    if (group.length > 1) {
      const lat = group.reduce((sum, b) => sum + b.lat, 0) / group.length;
      const lng = group.reduce((sum, b) => sum + b.lng, 0) / group.length;
      const p = input.point({ ...group[0], lat, lng });
      occupied.push({ x: p.x, y: p.y, width: 48, height: 48, cluster: true });
      continue;
    }
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
    const itemScale = type === 'dot' ? 1 : scale;
    layouts.set(biz.id, { biz, point: p, type, scale: itemScale, width: cardWidth, height: cardHeight });
    if (type === 'card') occupied.push({ x: p.x, y: p.y, width: cardWidth, height: cardHeight, cluster: false });
  }

  return { groups, singletonIds, clusterKeys, layouts, isDistrictView, scale };
}
