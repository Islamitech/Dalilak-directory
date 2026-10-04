export {
  computeCategoryCounts,
  type CategoryCounts,
} from './model/filterModel';

export {
  getRecentSearches,
  saveRecentSearchTerm,
  clearRecentSearchesList,
} from './model/recentSearches';

export { SmartSearchBar, type SmartSearchBarProps } from './components/SmartSearchBar';
export { SearchSuggestionsDropdown } from './components/SearchSuggestionsDropdown';
export { CadastralBuildingCard, type CadastralBuildingCardProps } from './components/CadastralBuildingCard';
export { useUnifiedSearch, type UseUnifiedSearchOptions } from './hooks/useUnifiedSearch';
export { type SearchViewProps } from './model/searchViewLogic';
