export {
  computeCategoryCounts,
  type CategoryCounts,
  INTEGRATED_FILTER_CATEGORIES,
  type QuickCategoryItem,
} from './model/filterModel';

export {
  getRecentSearches,
  saveRecentSearchTerm,
  clearRecentSearchesList,
} from './model/recentSearches';

export { SmartSearchBar, type SmartSearchBarProps } from './components/SmartSearchBar';
export { SearchSuggestionsDropdown } from './components/SearchSuggestionsDropdown';
export { CadastralBuildingCard, type CadastralBuildingCardProps } from './components/CadastralBuildingCard';
export { UnifiedSearchFilterBar, type UnifiedSearchFilterBarProps } from './components/UnifiedSearchFilterBar';
export { useUnifiedSearch, type UseUnifiedSearchOptions } from './hooks/useUnifiedSearch';
export { useIntegratedFilters, type UseIntegratedFiltersParams } from './hooks/useIntegratedFilters';
export { type SearchViewProps } from './model/searchViewLogic';
