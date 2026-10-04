export {
  computeCategoryCounts,
  type CategoryCounts,
} from './model/filterModel';

export {
  getRecentSearches,
  saveRecentSearchTerm,
  clearRecentSearchesList,
} from './model/recentSearches';

export { FilterDrawer, type FilterDrawerProps } from './components/FilterDrawer';
export { SmartSearchBar, type SmartSearchBarProps } from './components/SmartSearchBar';
export { SearchHeroHeader } from './components/SearchHeroHeader';
export { SearchDiscoveryCategories } from './components/SearchDiscoveryCategories';
export { SearchSuggestionsDropdown } from './components/SearchSuggestionsDropdown';
export { SearchResultsSection } from './components/SearchResultsSection';
export { useUnifiedSearch, type UseUnifiedSearchOptions } from './hooks/useUnifiedSearch';
export {
  type SearchViewProps,
  computeFeaturedBusinesses,
  handleLocationSelection,
} from './model/searchViewLogic';
