import { Business } from '../../../types';
import { calculateDistanceKm } from '../../../utils/directoryEnhancements';

export interface DispersedPinResult {
  biz: Business;
  originCoord: [number, number];
  dispersedCoord: [number, number];
  isDispersed: boolean;
}

/**
 * Converts a distance in meters along a given bearing angle (in radians)
 * into geographic delta latitude and delta longitude.
 */
function offsetMetersToLatLng(
  lat: number,
  meters: number,
  angleRad: number
): [number, number] {
  const earthRadius = 6378137; // in meters
  const dLat = (meters * Math.sin(angleRad)) / earthRadius;
  const dLng =
    (meters * Math.cos(angleRad)) /
    (earthRadius * Math.cos((lat * Math.PI) / 180));

  return [(dLat * 180) / Math.PI, (dLng * 180) / Math.PI];
}

/**
 * Deterministic pseudo-random jitter based on business id string
 * Produces consistent values without screen jump on re-renders.
 */
function getDeterministicJitter(id: string, factor: number): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const normalized = (Math.abs(hash) % 1000) / 1000; // 0 to 1
  return (normalized - 0.5) * 2 * factor; // -factor to +factor
}

/**
 * Disperses activities that share the same or very close coordinates (< collisionThresholdMeters).
 * Fans them out organically towards the interior/centroid of the district polygon so they
 * remain inside the district boundary and do not overlap.
 */
export function disperseCoincidentPins(
  businesses: Business[],
  districtCentroid?: [number, number] | null,
  collisionThresholdMeters = 55
): DispersedPinResult[] {
  if (!businesses || businesses.length === 0) return [];

  // Group businesses into spatial collision clusters
  const clusters: Business[][] = [];
  const visited = new Set<string>();

  for (let i = 0; i < businesses.length; i++) {
    const bA = businesses[i];
    if (visited.has(bA.id)) continue;

    const cluster: Business[] = [bA];
    visited.add(bA.id);

    for (let j = i + 1; j < businesses.length; j++) {
      const bB = businesses[j];
      if (visited.has(bB.id)) continue;

      const distKm = calculateDistanceKm(bA.lat, bA.lng, bB.lat, bB.lng);
      if (distKm * 1000 < collisionThresholdMeters) {
        cluster.push(bB);
        visited.add(bB.id);
      }
    }

    clusters.push(cluster);
  }

  const results: DispersedPinResult[] = [];

  for (const cluster of clusters) {
    if (cluster.length === 1) {
      // Standalone business - no dispersal needed
      const biz = cluster[0];
      results.push({
        biz,
        originCoord: [biz.lat, biz.lng],
        dispersedCoord: [biz.lat, biz.lng],
        isDispersed: false,
      });
      continue;
    }

    // Multiple businesses sharing the same or very close coordinates
    // 1. Calculate the central anchor point on the ground
    const originLat =
      cluster.reduce((acc, b) => acc + b.lat, 0) / cluster.length;
    const originLng =
      cluster.reduce((acc, b) => acc + b.lng, 0) / cluster.length;
    const originCoord: [number, number] = [originLat, originLng];

    // 2. Compute base orientation angle pointing inwards towards district centroid
    let baseAngle: number;
    if (
      districtCentroid &&
      typeof districtCentroid[0] === 'number' &&
      typeof districtCentroid[1] === 'number'
    ) {
      const dLat = districtCentroid[0] - originLat;
      const dLng =
        (districtCentroid[1] - originLng) *
        Math.cos((originLat * Math.PI) / 180);
      baseAngle = Math.atan2(dLat, dLng);
    } else {
      // Default upward (North) if no centroid is provided
      baseAngle = Math.PI / 2;
    }

    // 3. Fan-out geometry configuration according to cluster size
    // For 3 activities, distribute: Left (-42°), Center (0°), Right (+42°)
    // with staggered radial distance to guarantee zero card collision
    const count = cluster.length;

    cluster.forEach((biz, idx) => {
      let angleOffsetDeg = 0;
      let baseDistanceMeters = 85;

      if (count === 2) {
        angleOffsetDeg = idx === 0 ? -32 : 32;
        baseDistanceMeters = 85 + (idx % 2 === 0 ? 0 : 15);
      } else if (count === 3) {
        if (idx === 0) {
          // #1 Prominent (Center-Forward along vector)
          angleOffsetDeg = 0;
          baseDistanceMeters = 115;
        } else if (idx === 1) {
          // #2 Prominent (Left flank)
          angleOffsetDeg = -44;
          baseDistanceMeters = 75;
        } else {
          // #3 Prominent (Right flank)
          angleOffsetDeg = 44;
          baseDistanceMeters = 78;
        }
      } else {
        // Fallback for > 3 items
        const stepDeg = 160 / Math.max(1, count - 1);
        angleOffsetDeg = -80 + idx * stepDeg;
        baseDistanceMeters = 75 + (idx % 3) * 20;
      }

      // Add subtle organic jitter so lines look natural and not mechanically identical
      const angleJitterRad =
        (getDeterministicJitter(biz.id, 6) * Math.PI) / 180;
      const distJitterMeters = getDeterministicJitter(biz.id + '_dist', 8);

      const finalAngleRad =
        baseAngle + (angleOffsetDeg * Math.PI) / 180 + angleJitterRad;
      const finalDistanceMeters = Math.max(
        55,
        baseDistanceMeters + distJitterMeters
      );

      const [deltaLat, deltaLng] = offsetMetersToLatLng(
        originLat,
        finalDistanceMeters,
        finalAngleRad
      );

      const dispersedCoord: [number, number] = [
        originLat + deltaLat,
        originLng + deltaLng,
      ];

      results.push({
        biz,
        originCoord,
        dispersedCoord,
        isDispersed: true,
      });
    });
  }

  return results;
}
