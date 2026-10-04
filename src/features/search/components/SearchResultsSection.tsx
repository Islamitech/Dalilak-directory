import React, { useState, useMemo } from 'react';
import { RotateCcw, Heart, ArrowUpDown } from 'lucide-react';
import { Business } from '../../../types';
import { FilterBar } from '../../../components/search/FilterBar';
import { ActiveFilterChips } from '../../../components/search/ActiveFilterChips';
import { BusinessCardGrid } from '../../../components/cards/BusinessCardGrid';
import { Button } from '../../../shared/ui';
import { getCategoryGroupById, getCategoryLabel, getSubcategoryById } from '../../../data/categoryTaxonomy';
import { parseHadayekBuildingAddress } from '../../../utils/hadayekBuildingSearch';
import { getRecommendedGateForZone } from '../../../data/hadayekAtlasData';
import { CadastralBuildingCard } from './CadastralBuildingCard';

const SORT_CYCLE = ['default', 'rating', 'reviews', 'name'] as const;
const SORT_LABELS: Record<string, string> = {
  default: 'الافتراضي',
  rating: 'الأعلى تقييماً',
  reviews: 'الأكثر مراجعات',
  name: 'أبجدي',
};

interface SearchResultsSectionProps {
  filteredBusinesses: Business[];
  loading: boolean;
  searchQuery?: string;
  selectedZone?: string;
  categoryFilter: string;
  onCategoryChange: (cat: string) => void;
  subcategoryFilter: string;
  onSubcategoryChange: (cat: string) => void;
  sortBy: any;
  onSortChange: (s: any) => void;
  openNowOnly: boolean;
  onToggleOpenNow: () => void;
  hasVideoOnly: boolean;
  onToggleHasVideo: () => void;
  onOpenFilterDrawer: () => void;
  advancedFiltersCount: number;
  onNavigate: (path: string) => void;
  onReshuffle?: () => void;
  handleReturnToDiscovery: () => void;
  hasActiveFilters: boolean;
  selectedGov: string;
  onGovChange: (g: string) => void;
  selectedCity: string;
  onCityChange: (c: string) => void;
  onOpenBusiness: (biz: Business) => void;
  onToggleFavorite: (id: string) => void;
  favorites: string[];
  userCoords: { lat: number; lng: number } | null;
  onOpenVideoModal?: (biz: Business) => void;
}

export const SearchResultsSection: React.FC<SearchResultsSectionProps> = ({
  filteredBusinesses, loading, searchQuery, selectedZone, categoryFilter, onCategoryChange,
  subcategoryFilter, onSubcategoryChange, sortBy, onSortChange, openNowOnly, onToggleOpenNow,
  hasVideoOnly, onToggleHasVideo, onOpenFilterDrawer, advancedFiltersCount, onNavigate,
  onReshuffle, handleReturnToDiscovery, hasActiveFilters, selectedGov, onGovChange,
  selectedCity, onCityChange, onOpenBusiness, onToggleFavorite, favorites, userCoords,
  onOpenVideoModal,
}) => {
  const [favFilter, setFavFilter] = useState(false);

  const handleCycleSort = () => {
    const current = (typeof sortBy === 'string' ? sortBy : 'default') || 'default';
    const idx = SORT_CYCLE.indexOf(current as any);
    const next = SORT_CYCLE[(idx + 1) % SORT_CYCLE.length];
    onSortChange(next);
  };

  const displayedBusinesses = favFilter
    ? filteredBusinesses.filter((b) => favorites.includes(b.id))
    : filteredBusinesses;

  const [isBuildingFound, setIsBuildingFound] = useState<boolean>(true);

  const cadastralBuilding = useMemo(() => {
    if (!searchQuery) return null;
    const match = parseHadayekBuildingAddress(searchQuery, selectedZone);
    if (!match) return null;
    const gateInfo = getRecommendedGateForZone(match.zoneLetter);
    return {
      buildingNumber: match.buildingNumber,
      zoneLetter: match.zoneLetter,
      nearestGateName: gateInfo?.primaryGate?.popularNameAr || 'البوابة الأولى',
    };
  }, [searchQuery, selectedZone]);

  React.useEffect(() => {
    let cancelled = false;
    if (!cadastralBuilding) {
      setIsBuildingFound(true);
      return;
    }
    import('../../../data/hadayekAtlasData').then(({ searchBuildingCoordinatesExact }) => {
      searchBuildingCoordinatesExact(cadastralBuilding.zoneLetter, cadastralBuilding.buildingNumber).then((coords) => {
        if (!cancelled) {
          setIsBuildingFound(Boolean(coords));
        }
      });
    });
    return () => {
      cancelled = true;
    };
  }, [cadastralBuilding?.zoneLetter, cadastralBuilding?.buildingNumber]);

  return (
    <div className="space-y-5 pt-2">
      <FilterBar
        categoryFilter={categoryFilter}
        onCategoryChange={onCategoryChange}
        sortBy={sortBy}
        onSortChange={onSortChange}
        openNowOnly={openNowOnly}
        onToggleOpenNow={onToggleOpenNow}
        hasVideoOnly={hasVideoOnly}
        onToggleHasVideo={onToggleHasVideo}
        onOpenFilterDrawer={onOpenFilterDrawer}
        activeFiltersCount={advancedFiltersCount}
        showViewToggle={true}
        onViewChange={(view) => {
          if (view === 'map') onNavigate('/map');
        }}
        onReshuffle={onReshuffle}
      />

      {/* Prototype List Header (.list-header) */}
      <div className="list-header flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 sm:p-4 rounded-2xl shadow-2xs">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>الأنشطة</span>
            <span
              className="count inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500/15 text-amber-800 dark:text-amber-300 font-mono"
              id="listCount"
            >
              {displayedBusinesses.length}
            </span>
          </h3>
          {categoryFilter !== 'all' && (
            <span className="text-xs font-bold text-amber-900 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
              {getCategoryLabel(categoryFilter)}
            </span>
          )}
          {subcategoryFilter !== 'all' && (
            <span className="text-xs font-bold text-slate-800 bg-slate-100 dark:bg-slate-800 dark:text-slate-200 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
              {getCategoryLabel(subcategoryFilter)}
            </span>
          )}
        </div>

        {/* Prototype List Tools (.list-tools: #favToolBtn, #sortBtn) */}
        <div className="list-tools flex items-center gap-2 flex-wrap">
          <button
            type="button"
            id="favToolBtn"
            onClick={() => setFavFilter(!favFilter)}
            className={`tool-btn min-h-[34px] px-3.5 rounded-full border text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
              favFilter
                ? 'active bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-amber-400'
            }`}
            title="تصفية المفضلة"
          >
            <Heart className={`w-3.5 h-3.5 ${favFilter ? 'fill-current text-slate-950' : 'text-slate-400'}`} />
            <span>المفضلة</span>
            {favorites.length > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {favorites.length}
              </span>
            )}
          </button>

          <button
            type="button"
            id="sortBtn"
            onClick={handleCycleSort}
            className={`tool-btn min-h-[34px] px-3.5 rounded-full border text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
              sortBy !== 'default'
                ? 'active bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-amber-400'
            }`}
            title="تبديل الترتيب"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span id="sortLabel">{SORT_LABELS[sortBy] || 'الافتراضي'}</span>
          </button>

          <Button variant="outline" size="sm" onClick={handleReturnToDiscovery} icon={<RotateCcw className="w-3.5 h-3.5" />}>
            صفحة الاكتشاف
          </Button>
        </div>
      </div>

      {/* Cadastral Building Intent Card */}
      {cadastralBuilding && (
        <CadastralBuildingCard
          buildingNumber={cadastralBuilding.buildingNumber}
          zoneLetter={cadastralBuilding.zoneLetter}
          nearestGateName={cadastralBuilding.nearestGateName}
          isFound={isBuildingFound}
          onNavigateToMap={(z, b) => onNavigate(`/map?zone=${encodeURIComponent(z)}&bldg=${encodeURIComponent(b)}`)}
        />
      )}

      {hasActiveFilters && (
        <ActiveFilterChips
          categoryFilter={categoryFilter}
          categoryLabel={getCategoryGroupById(categoryFilter)?.label}
          subcategoryFilter={subcategoryFilter}
          subcategoryLabel={getSubcategoryById(subcategoryFilter)?.label}
          onClearCategory={() => {
            onCategoryChange('all');
            onSubcategoryChange('all');
          }}
          onClearSubcategory={() => onSubcategoryChange('all')}
          selectedGov={selectedGov}
          onClearGov={() => onGovChange('all')}
          selectedCity={selectedCity}
          onClearCity={() => onCityChange('all')}
          openNowOnly={openNowOnly}
          onClearOpenNow={onToggleOpenNow}
          hasVideoOnly={hasVideoOnly}
          onClearHasVideo={onToggleHasVideo}
          sortBy={sortBy}
          onClearSort={() => onSortChange('default')}
          onResetAll={handleReturnToDiscovery}
          hasActiveFilters={hasActiveFilters}
          hideResetButton={false}
        />
      )}

      <BusinessCardGrid
        businesses={displayedBusinesses}
        loading={loading}
        onOpenBusiness={onOpenBusiness}
        onToggleFavorite={onToggleFavorite}
        favorites={favorites}
        userCoords={userCoords}
        onResetFilters={() => {
          if (favFilter) setFavFilter(false);
          handleReturnToDiscovery();
        }}
        onOpenVideoModal={onOpenVideoModal}
      />
    </div>
  );
};
