import { useCallback, useEffect, useRef } from 'react';
import { Business } from '../../../types';
import { consumeBusinessNavigation } from '../../../shared/lib/pendingNavigation';

export interface NavigationTarget {
  title: string;
  lat: number;
  lng: number;
  type: 'building' | 'business';
  details?: string;
}

interface Params {
  focusedBusiness?: Business | null;
  setSelectedBiz: (biz: null) => void;
  setSelectedBuilding: (building: null) => void;
  onClearFocusedBusiness?: () => void;
  setNavigationTarget: (target: NavigationTarget) => void;
  onStartNavigation?: (target: NavigationTarget) => void;
}

/**
 * In-app navigation to an activity (same flow and route layer as buildings).
 * Starts from the map card's "Directions" button, or automatically when "Directions" was pressed
 * outside the map (e.g. in the activity details) and the map then shows that activity.
 */
export function useBusinessNavigationStart({
  focusedBusiness,
  setSelectedBiz,
  setSelectedBuilding,
  onClearFocusedBusiness,
  setNavigationTarget,
  onStartNavigation,
}: Params) {
  const startBusinessNavigation = useCallback((biz: Business) => {
    if (!biz || !Number.isFinite(biz.lat) || !Number.isFinite(biz.lng)) return;
    const target: NavigationTarget = {
      title: biz.nameAr || biz.name || 'النشاط',
      lat: biz.lat,
      lng: biz.lng,
      type: 'business',
      details: biz.category || undefined,
    };
    setSelectedBiz(null);
    setSelectedBuilding(null);
    onClearFocusedBusiness?.();
    setNavigationTarget(target);
    onStartNavigation?.(target);
  }, [setSelectedBiz, setSelectedBuilding, onClearFocusedBusiness, setNavigationTarget, onStartNavigation]);

  // Dev StrictMode runs mount effects twice; remembering the id keeps the second run idempotent.
  const startedForRef = useRef<string | null>(null);
  useEffect(() => {
    if (!focusedBusiness) {
      startedForRef.current = null;
      return;
    }
    if (startedForRef.current === focusedBusiness.id || consumeBusinessNavigation(focusedBusiness.id)) {
      startedForRef.current = focusedBusiness.id;
      startBusinessNavigation(focusedBusiness);
    }
  }, [focusedBusiness, startBusinessNavigation]);

  return startBusinessNavigation;
}
