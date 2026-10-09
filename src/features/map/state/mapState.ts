import { Business } from '../../../types';
import { MapViewportSnapshot } from './mapViewport';

export interface MapState {
  searchQuery: string;
  selectedZone: string;
  categoryFilter: string;
  selectedBusiness: Business | null;
  viewport: MapViewportSnapshot | null;
}

export type MapStateAction =
  | { type: 'search/set'; query: string }
  | { type: 'zone/set'; zone: string }
  | { type: 'category/set'; category: string }
  | { type: 'selection/set'; business: Business | null }
  | { type: 'viewport/set'; viewport: MapViewportSnapshot };

export function createInitialMapState(values: Partial<MapState> = {}): MapState {
  return {
    searchQuery: '',
    selectedZone: '',
    categoryFilter: 'all',
    selectedBusiness: null,
    viewport: null,
    ...values,
  };
}

export function mapStateReducer(state: MapState, action: MapStateAction): MapState {
  switch (action.type) {
    case 'search/set': return { ...state, searchQuery: action.query };
    case 'zone/set': return { ...state, selectedZone: action.zone };
    case 'category/set': return { ...state, categoryFilter: action.category };
    case 'selection/set': return { ...state, selectedBusiness: action.business };
    case 'viewport/set': return { ...state, viewport: action.viewport };
  }
}
