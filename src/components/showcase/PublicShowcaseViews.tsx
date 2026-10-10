import React from 'react';
import { Business } from '../../types';
import { parseActivitySearchIntent } from '../../utils/activitySearchIntent';
import { useShowcaseFilterState } from './hooks/useShowcaseFilterState';
import { Button } from '../../shared/ui';

const SearchView = React.lazy(() => import('../views/SearchView').then((m) => ({ default: m.SearchView })));
const MapView = React.lazy(() => import('../views/MapView').then((m) => ({ default: m.MapView })));
const FavoritesView = React.lazy(() => import('../views/FavoritesView').then((m) => ({ default: m.FavoritesView })));
const ForBusinessView = React.lazy(() => import('../../features/for-business').then((m) => ({ default: m.ForBusinessView })));
const BusinessPricingView = React.lazy(() => import('../views/BusinessPricingView').then((m) => ({ default: m.BusinessPricingView })));
const AboutView = React.lazy(() => import('../views/AboutView').then((m) => ({ default: m.AboutView })));

export interface PublicShowcaseViewsProps {
  currentPath: string;
  filterState: ReturnType<typeof useShowcaseFilterState>;
  publicBusinesses: Business[];
  filteredBusinesses?: Business[];
  effectiveMapCategoryFilter: string;
  effectiveSearchZone: string;
  favorites: string[];
  toggleFavorite: (id: string) => void;
  userCoords: { lat: number; lng: number } | null;
  isLocatingUser: boolean;
  handleRequestLocation: () => void;
  handleNavigate: (path: string) => void;
  mapCenter: { lat: number; lng: number };
  focusedMapBiz: Business | null;
  setFocusedMapBiz: (biz: Business | null) => void;
  handleOpenBusiness: (biz: Business) => void;
  setSelectedVideoBiz: (biz: Business | null) => void;
  handleReshuffle: () => void;
  loading: boolean;
}

export const PublicShowcaseViews: React.FC<PublicShowcaseViewsProps> = ({
  currentPath,
  filterState,
  publicBusinesses,
  filteredBusinesses,
  effectiveMapCategoryFilter,
  effectiveSearchZone,
  favorites,
  toggleFavorite,
  userCoords,
  isLocatingUser,
  handleRequestLocation,
  handleNavigate,
  mapCenter,
  focusedMapBiz,
  setFocusedMapBiz,
  handleOpenBusiness,
  setSelectedVideoBiz,
  handleReshuffle,
  loading,
}) => {
  const cleanRoute = currentPath.toLowerCase().split('?')[0];
  const changeCategory = (category: string) => {
    if (parseActivitySearchIntent(filterState.searchQuery)) filterState.setSearchQuery('');
    filterState.handleCategoryChange(category);
  };

  switch (cleanRoute) {
    case '/':
    case '/map':
      return (
        <MapView
          searchQuery={filterState.searchQuery}
          onSearchChange={filterState.setSearchQuery}
          businesses={publicBusinesses}
          filteredBusinesses={filteredBusinesses}
          categoryFilter={effectiveMapCategoryFilter}
          onCategoryChange={changeCategory}
          selectedZone={effectiveSearchZone}
          onZoneChange={filterState.setHadayekZoneFilter}
          sortBy={filterState.sortBy}
          onSortChange={filterState.setSortBy}
          openNowOnly={filterState.openNowOnly}
          onToggleOpenNow={() => filterState.setOpenNowOnly(!filterState.openNowOnly)}
          verifiedOnly={filterState.verifiedOnly}
          hideActivities={filterState.hideActivities}
          filtersActive={filterState.hasActiveFilters}
          onResetAllFilters={filterState.resetAllFilters}
          onOpenBusiness={handleOpenBusiness}
          onToggleFavorite={toggleFavorite}
          favorites={favorites}
          userCoords={userCoords}
          onNavigate={handleNavigate}
          lat={mapCenter.lat}
          lng={mapCenter.lng}
          focusedBusiness={focusedMapBiz}
          onClearFocusedBusiness={() => setFocusedMapBiz(null)}
        />
      );

    case '/search':
      return (
        <SearchView
          filteredBusinesses={filteredBusinesses}
          allBusinesses={publicBusinesses}
          loading={loading}
          searchQuery={filterState.searchQuery}
          onSearchChange={filterState.setSearchQuery}
          selectedGov={filterState.govFilter}
          onGovChange={filterState.setGovFilter}
          selectedCity={filterState.cityFilter}
          onCityChange={filterState.setCityFilter}
          selectedZone={effectiveSearchZone}
          onZoneChange={filterState.setHadayekZoneFilter}
          categoryFilter={effectiveMapCategoryFilter}
          onCategoryChange={changeCategory}
          subcategoryFilter={filterState.subcategoryFilter}
          onSubcategoryChange={filterState.setSubcategoryFilter}
          sortBy={filterState.sortBy}
          onSortChange={filterState.setSortBy}
          openNowOnly={filterState.openNowOnly}
          onToggleOpenNow={() => filterState.setOpenNowOnly(!filterState.openNowOnly)}
          verifiedOnly={filterState.verifiedOnly}
          hasRatingOnly={filterState.hasRatingOnly}
          onToggleHasRating={() => filterState.setHasRatingOnly(!filterState.hasRatingOnly)}
          hasVideoOnly={filterState.hasVideoOnly}
          onToggleHasVideo={() => filterState.setHasVideoOnly(!filterState.hasVideoOnly)}
          userCoords={userCoords}
          isLocatingUser={isLocatingUser}
          onRequestLocation={handleRequestLocation}
          onOpenBusiness={handleOpenBusiness}
          onToggleFavorite={toggleFavorite}
          favorites={favorites}
          onResetAllFilters={filterState.resetAllFilters}
          hasActiveFilters={filterState.hasActiveFilters}
          onOpenVideoModal={(b) => setSelectedVideoBiz(b)}
          onNavigate={handleNavigate}
          onReshuffle={handleReshuffle}
        />
      );

    case '/favorites':
      return (
        <FavoritesView
          businesses={publicBusinesses}
          favorites={favorites}
          onOpenBusiness={handleOpenBusiness}
          onToggleFavorite={toggleFavorite}
          userCoords={userCoords}
          onNavigate={handleNavigate}
          onOpenVideoModal={(b) => setSelectedVideoBiz(b)}
        />
      );

    case '/for-business':
    case '/add-business':
      return <ForBusinessView onNavigate={handleNavigate} />;

    case '/pricing':
    case '/business-pricing':
      return (
        <BusinessPricingView
          businesses={publicBusinesses}
          onNavigate={handleNavigate}
        />
      );

    case '/about':
      return <AboutView onNavigate={handleNavigate} />;

    default:
      return (
        <section className="max-w-md mx-auto px-6 py-16 text-center space-y-4">
          <p className="text-6xl font-extrabold text-amber-500" aria-hidden="true">404</p>
          <h1 className="text-xl font-extrabold text-slate-900">الصفحة غير موجودة</h1>
          <p className="text-sm font-medium text-slate-600">تحقق من الرابط أو عُد إلى الدليل.</p>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <Button variant="primary" size="lg" onClick={() => handleNavigate('/map')}>
              الخريطة التفاعلية
            </Button>
            <Button variant="secondary" size="lg" onClick={() => handleNavigate('/search')}>
              قائمة الأنشطة
            </Button>
          </div>
        </section>
      );
  }
};
