import type { Business } from '../types';

export type DirectoryScope = 'hadayek' | 'all';

const SCOPE_KEY = 'dalilak:directory-scope';

export function readDirectoryScope(): DirectoryScope {
  try {
    return sessionStorage.getItem(SCOPE_KEY) === 'all' ? 'all' : 'hadayek';
  } catch {
    return 'hadayek';
  }
}

export function rememberDirectoryScope(scope: DirectoryScope): void {
  try {
    sessionStorage.setItem(SCOPE_KEY, scope);
  } catch {
    /* sessionStorage unavailable */
  }
}

/** Egypt only. Drops pins geocoded in Jeddah or Riyadh so the camera stays on the directory. */
export function isEgyptMapPoint(lat: number, lng: number): boolean {
  return lat > 22 && lat < 32.6 && lng > 24.6 && lng < 36.9;
}

export function hasMapCoordinates(biz: { lat?: number; lng?: number }): boolean {
  return (
    typeof biz.lat === 'number' &&
    typeof biz.lng === 'number' &&
    Number.isFinite(biz.lat) &&
    Number.isFinite(biz.lng) &&
    biz.lat !== 0 &&
    biz.lng !== 0 &&
    Math.abs(biz.lat) <= 90 &&
    Math.abs(biz.lng) <= 180
  );
}

export function pinsInScope(list: Business[], scope: DirectoryScope): Business[] {
  if (scope !== 'all') return list;
  return list.filter(hasMapCoordinates);
}
