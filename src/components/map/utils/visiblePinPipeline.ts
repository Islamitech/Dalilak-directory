import { Business } from '../../../types';
import { activityCardScale, groupNearbyActivities } from './spatialActivityGroups';
import { isLocalPinPresentationZoom, MAP_ZOOM_POLICY } from '../../../utils/mapZoomPolicy';
import { getBusinessPinCategoryId } from '../markers/categoryPinStyle';
import { categoryClusterFootprint, categoryPinLimitForZoom, splitGroupByCategory } from './categoryPinGroups';

/** City-overview zoom groups by screen proximity (wide); local zoom keeps clusters tight to physically close activities. */
const CITY_OVERVIEW_GROUP_METERS = 1000;
const LOCAL_GROUP_METERS = 100;

export interface PinPoint { x: number; y: number }
export interface PinLayout {
  biz: Business;
  point: PinPoint;
  type: 'card' | 'dot';
  scale: number;
  width: number;
  height: number;
  useDetailedCard: boolean;
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

/** Screen footprint of a cluster = its row of per-category pins. */
const groupFootprint = (group: Business[], limit: number) =>
  categoryClusterFootprint(splitGroupByCategory(group, limit).length);

/**
 * Blue-noise spreading for the city overview: pick well-separated seeds (biggest groups first, so busy
 * places always get a pin) and fold every other group into its nearest seed. Seeds are never closer than
 * minDistance px, and every group sits within minDistance of a seed, so pins cover the whole populated
 * area evenly (organic, not a rigid grid) without leaving holes or piling up.
 */
function spreadGroupsEvenly(
  rawGroups: Business[][],
  point: (biz: Business) => PinPoint,
  minDistance: number
): Business[][] {
  const entries = rawGroups
    .map(items => ({ items, center: groupCenter(items, point) }))
    .sort((a, b) => b.items.length - a.items.length || a.items[0].id.localeCompare(b.items[0].id));
  const seeds: Array<{ items: Business[]; center: PinPoint }> = [];
  const rest: typeof entries = [];
  for (const entry of entries) {
    const taken = seeds.some(s => Math.hypot(s.center.x - entry.center.x, s.center.y - entry.center.y) < minDistance);
    if (taken) rest.push(entry);
    else seeds.push({ items: [...entry.items], center: entry.center });
  }
  for (const entry of rest) {
    let best = seeds[0];
    let bestDist = Infinity;
    for (const s of seeds) {
      const d = Math.hypot(s.center.x - entry.center.x, s.center.y - entry.center.y);
      if (d < bestDist) { bestDist = d; best = s; }
    }
    best.items.push(...entry.items);
  }
  return seeds.map(s => s.items);
}

const hashId = (id: string): number => {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

/**
 * Individual-pin scatter (used while a category filter is active): every pin is one real activity.
 * Candidates are visited in a stable pseudo-random order and accepted when no accepted pin is closer
 * than minDistance px, producing an even, organic spread (blue noise) with no overlaps. Zooming in
 * lowers the density per screen area so more activities appear.
 */
function scatterIndividualActivities(
  candidates: Business[],
  point: (biz: Business) => PinPoint,
  minDistance: number,
  maxPins: number
): Business[][] {
  const cell = minDistance;
  const grid = new Map<string, PinPoint[]>();
  const picked: Business[][] = [];
  // Round-robin across categories (each in stable pseudo-random order) so the visible set is diverse:
  // every activity type gets a pin before any type gets a second one.
  const buckets = new Map<string, Business[]>();
  for (const biz of candidates) {
    const id = getBusinessPinCategoryId(biz);
    const list = buckets.get(id);
    if (list) list.push(biz);
    else buckets.set(id, [biz]);
  }
  const lists = [...buckets.entries()]
    .sort(([a], [b]) => hashId(a) - hashId(b) || a.localeCompare(b))
    .map(([, list]) => list.sort((a, b) => hashId(a.id) - hashId(b.id) || a.id.localeCompare(b.id)));
  const ordered: Business[] = [];
  for (let round = 0; lists.some(l => round < l.length); round++) {
    for (const l of lists) if (round < l.length) ordered.push(l[round]);
  }
  for (const biz of ordered) {
    if (picked.length >= maxPins) break;
    const p = point(biz);
    const gx = Math.floor(p.x / cell);
    const gy = Math.floor(p.y / cell);
    let blocked = false;
    for (let x = gx - 1; x <= gx + 1 && !blocked; x++) {
      for (let y = gy - 1; y <= gy + 1 && !blocked; y++) {
        blocked = (grid.get(`${x}:${y}`) ?? []).some(q => Math.hypot(q.x - p.x, q.y - p.y) < minDistance);
      }
    }
    if (blocked) continue;
    const key = `${gx}:${gy}`;
    grid.set(key, [...(grid.get(key) ?? []), p]);
    picked.push([biz]);
  }
  return picked;
}

/** Merge multi-member groups whose category-pin rows would overlap on screen, so clusters never stack. */
function mergeOverlappingGroups(
  rawGroups: Business[][],
  point: (biz: Business) => PinPoint,
  limit: number,
  minCenterDistance: number
): Business[][] {
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
        const fa = groupFootprint(groups[i], limit);
        const fb = groupFootprint(groups[j], limit);
        const footprintsOverlap =
          Math.abs(a.x - b.x) < (fa.width + fb.width) / 2 + 4 && Math.abs(a.y - b.y) < (fa.height + fb.height) / 2 + 4;
        if (Math.hypot(a.x - b.x, a.y - b.y) < minCenterDistance || footprintsOverlap) {
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
  /** One pin per real activity (scattered evenly) instead of per-category cluster pins. */
  individual?: boolean;
}): VisiblePinPipelineResult {
  const scale = activityCardScale(input.zoom);
  const isDistrictView = input.hasSelectedZone || isLocalPinPresentationZoom(input.zoom);
  const selectedBusinessId = input.selectedBusiness?.id ?? input.selectedBusinessId;
  const candidates = input.businesses.filter(b => b.id !== selectedBusinessId && input.contains(b.lat, b.lng));
  const groupMeters = input.zoom < MAP_ZOOM_POLICY.localPinPresentationFrom ? CITY_OVERVIEW_GROUP_METERS : LOCAL_GROUP_METERS;
  const isOverview = input.zoom < MAP_ZOOM_POLICY.localPinPresentationFrom;
  const pinLimit = categoryPinLimitForZoom(input.zoom);
  // Wider screen-space cells at overview zoom => fewer, evenly spread pins instead of dense hotspots.
  // Deliberately sparse: a handful of well-spaced, diverse pins that never crowd the map.
  const individualMinDistance = input.zoom >= MAP_ZOOM_POLICY.detailedActivityCardsFrom ? 96 : isOverview ? 82 : 80;
  const individualMaxPins = input.zoom >= MAP_ZOOM_POLICY.detailedActivityCardsFrom ? 22 : isOverview ? 12 : 18;
  const baseGroups = input.individual
    ? scatterIndividualActivities(candidates, input.point, individualMinDistance, individualMaxPins)
    : groupNearbyActivities(candidates, input.project, input.groupRadius ?? (isOverview ? 40 : 64), groupMeters);
  const groups = mergeOverlappingGroups(
    isOverview && !input.individual ? spreadGroupsEvenly(baseGroups, input.point, 88) : baseGroups,
    input.point,
    pinLimit,
    isOverview ? 60 : 90
  );
  const clusterKeys = new Set(groups.filter(g => g.length > 1).map(visiblePinClusterKey));
  const prominent = new Set(candidates.slice(0, 3).map(b => b.id));
  const useDetailedCard = input.zoom >= MAP_ZOOM_POLICY.detailedActivityCardsFrom;
  const singletonIds = new Set<string>();
  const occupied: Array<{ x: number; y: number; width: number; height: number; cluster: boolean; reserved?: boolean }> = [];
  const placedDots: PinPoint[] = [];
  const layouts = new Map<string, PinLayout>();

  // Reserve the selected card's footprint first so nearby cards never render underneath it.
  if (input.selectedBusiness && input.contains(input.selectedBusiness.lat, input.selectedBusiness.lng)) {
    const selectedPoint = input.point(input.selectedBusiness);
    occupied.push({ x: selectedPoint.x, y: selectedPoint.y, width: 256, height: 264, cluster: false, reserved: true });
  }

  // Register every cluster footprint before placing cards so a card processed
  // earlier can never land on a cluster it has not seen yet.
  for (const group of groups) {
    if (group.length <= 1) continue;
    const p = groupCenter(group, input.point);
    const footprint = groupFootprint(group, pinLimit);
    occupied.push({ x: p.x, y: p.y, width: footprint.width, height: footprint.height, cluster: true });
  }

  for (const group of groups) {
    if (group.length > 1) continue;
    const biz = group[0];
    const p = input.point(biz);
    const cardWidth = (useDetailedCard ? 256 : isDistrictView ? 184 : 224) * scale;
    const cardHeight = (useDetailedCard ? 264 : isDistrictView ? 157 : 68) * scale;
    const overlaps = occupied.some(slot => {
      const cx = p.x, cy = p.y - cardHeight / 2;
      const ox = slot.x, oy = slot.cluster ? slot.y : slot.y - slot.height / 2;
      const halfW = slot.cluster ? cardWidth / 2 + slot.width / 2 + 4 : (slot.width + cardWidth) / 2 + 10;
      const halfH = slot.cluster ? cardHeight / 2 + slot.height / 2 + 4 : (slot.height + cardHeight) / 2 + 10;
      return Math.abs(ox - cx) < halfW && Math.abs(oy - cy) < halfH;
    });
    const type = input.individual || overlaps || (!isDistrictView && !prominent.has(biz.id)) ? 'dot' : 'card';
    if (type === 'dot') {
      const dotHalfW = 20, dotHalfH = 26;
      const blocked = occupied.some(slot => {
        const ox = slot.x, oy = slot.cluster ? slot.y : slot.y - slot.height / 2;
        const halfW = slot.width / 2 + dotHalfW;
        const halfH = slot.height / 2 + dotHalfH;
        return Math.abs(ox - p.x) < halfW && Math.abs(oy - (p.y - 22)) < halfH;
      }) || placedDots.some(d => Math.abs(d.x - p.x) < 40 && Math.abs(d.y - p.y) < 44) && !input.individual;
      if (blocked) continue; // collision-hidden: reappears when the camera spreads markers apart
      placedDots.push({ x: p.x, y: p.y });
    }
    const itemScale = type === 'dot' ? 1 : scale;
    layouts.set(biz.id, { biz, point: p, type, scale: itemScale, width: cardWidth, height: cardHeight, useDetailedCard });
    singletonIds.add(biz.id);
    if (type === 'card') occupied.push({ x: p.x, y: p.y, width: cardWidth, height: cardHeight, cluster: false });
  }

  return { groups, singletonIds, clusterKeys, layouts, isDistrictView, scale };
}
