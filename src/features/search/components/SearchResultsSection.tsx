import React from 'react';
import { RotateCcw } from 'lucide-react';
import { Business } from '../../../types';
import { FilterBar } from '../../../components/search/FilterBar';
import { ActiveFilterChips } from '../../../components/search/ActiveFilterChips';
import { BusinessCardGrid } from '../../../components/cards/BusinessCardGrid';
import { Button } from '../../../shared/ui';
import { getCategoryGroupById, getCategoryLabel, getSubcategoryById } from '../../../data/categoryTaxonomy';

interface SearchResultsSectionProps {
  filteredBusinesses: Business[];
  loading: boolean;
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
  filteredBusinesses,
  loading,
  categoryFilter,
  onCategoryChange,
  subcategoryFilter,
  onSubcategoryChange,
  sortBy,
  onSortChange,
  openNowOnly,
  onToggleOpenNow,
  hasVideoOnly,
  onToggleHasVideo,
  onOpenFilterDrawer,
  advancedFiltersCount,
  onNavigate,
  onReshuffle,
  handleReturnToDiscovery,
  hasActiveFilters,
  selectedGov,
  onGovChange,
  selectedCity,
  onCityChange,
  onOpenBusiness,
  onToggleFavorite,
  favorites,
  userCoords,
  onOpenVideoModal,
}) => {
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

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-slate-200 p-3.5 rounded-2xl shadow-2xs">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-xs sm:text-sm font-black text-slate-900">نتائج البحث والأنشطة:</span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500 text-slate-950 font-mono shadow-2xs">
            {filteredBusinesses.length} نشاطاً
          </span>
          {categoryFilter !== 'all' && (
            <span className="text-xs font-bold text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              {getCategoryLabel(categoryFilter)}
            </span>
          )}
          {subcategoryFilter !== 'all' && (
            <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
              {getCategoryLabel(subcategoryFilter)}
            </span>
          )}
        </div>

        <Button variant="outline" size="sm" onClick={handleReturnToDiscovery} icon={<RotateCcw className="w-3.5 h-3.5" />}>
          العودة إلى صفحة الاكتشاف
        </Button>
      </div>

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
        businesses={filteredBusinesses}
        loading={loading}
        onOpenBusiness={onOpenBusiness}
        onToggleFavorite={onToggleFavorite}
        favorites={favorites}
        userCoords={userCoords}
        onResetFilters={handleReturnToDiscovery}
        onOpenVideoModal={onOpenVideoModal}
      />
    </div>
  );
};
