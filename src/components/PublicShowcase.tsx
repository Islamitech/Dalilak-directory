import React, { useState, useMemo, useCallback } from 'react';
import { useDirectoryNavigation } from '../hooks/useDirectoryNavigation';
import { useDirectoryLoad, DirectorySearchContext } from '../contexts/DirectoryLoadContext';
import { DirectoryStatus } from './DirectoryStatus';
import { isPublicBusiness } from '../shared/publicBusiness';
import { parseActivitySearchIntent } from '../utils/activitySearchIntent';
import { Business } from '../types';
import { getBusinessSlug } from '../utils/directoryUrl';
import { AppNavbar } from './layout/AppNavbar';
import { AppFooter } from './layout/AppFooter';
import { WhatsAppFloatingButton } from './layout/WhatsAppFloatingButton';
const DirectoryFilterSheet = React.lazy(() =>
  import('./showcase/DirectoryFilterSheet').then((m) => ({ default: m.DirectoryFilterSheet }))
);
import { useShowcaseFilterState } from './showcase/hooks/useShowcaseFilterState';
import { useFavorites } from '../features/favorites';
import { useShowcaseMetadata } from './showcase/hooks/useShowcaseMetadata';
import { useShowcaseGeolocation } from './showcase/hooks/useShowcaseGeolocation';
import { useShowcaseBusinessSelection } from './showcase/hooks/useShowcaseBusinessSelection';
import { PublicShowcaseViews } from './showcase/PublicShowcaseViews';
import { PublicShowcaseModals } from './showcase/PublicShowcaseModals';

export interface PublicShowcaseProps {
  businesses: Business[];
  initialBizId?: string;
  isPreviewMode?: boolean;
  referralCode?: string;
  loading?: boolean;
}

export const PublicShowcase: React.FC<PublicShowcaseProps> = ({
  businesses,
  initialBizId,
  referralCode,
  loading = false,
}) => {
  const routing = useDirectoryNavigation();
  const currentPath = routing.path;
  const directoryLoad = useDirectoryLoad();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((c) => (c === msg ? null : c));
    }, 3500);
  }, []);

  const filterState = useShowcaseFilterState();
  const { favorites, toggleFavorite } = useFavorites(showToast);
  const geo = useShowcaseGeolocation(filterState, showToast);

  const handleNavigate = useCallback((newPath: string) => {
    const url = new URL(newPath, window.location.origin);
    if ((url.pathname === '/' || url.pathname === '/map') && !url.searchParams.has('zone')) {
      filterState.setHadayekZoneFilter('all');
    }
    const cat = url.searchParams.get('cat');
    if (cat) filterState.handleCategoryChange(cat);
    routing.navigate(newPath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [filterState, routing]);

  const activityIntent = useMemo(
    () => (currentPath === '/' || currentPath.startsWith('/map')) ? parseActivitySearchIntent(filterState.deferredSearchQuery) : null,
    [currentPath, filterState.deferredSearchQuery]
  );
  const effectiveSearchZone = activityIntent?.zone ?? filterState.hadayekZoneFilter;
  const effectiveMapCategoryFilter =
    activityIntent?.category ??
    (filterState.subcategoryFilter !== 'all' ? filterState.subcategoryFilter : filterState.categoryFilter);

  const handleReshuffle = useCallback(() => {
    filterState.setShuffleSeed(Date.now() ^ Math.floor(Math.random() * 1000000));
    showToast('تمت إعادة خلط وترتيب الأنشطة عشوائياً 🔀');
  }, [filterState, showToast]);

  const selectedBiz = useMemo(
    () =>
      businesses.find(
        (b) =>
          isPublicBusiness(b) &&
          (b.id === routing.token || getBusinessSlug(b) === routing.token || b.customDirectoryUrl === routing.token)
      ) || null,
    [businesses, routing.token]
  );

  const {
    selectedVideoBiz,
    setSelectedVideoBiz,
    pinnedDirectBizId,
    focusedMapBiz,
    setFocusedMapBiz,
    handleShowBusinessOnMap,
    handleOpenBusiness,
    handleCloseBusiness,
  } = useShowcaseBusinessSelection({
    selectedBiz,
    initialBizId,
    filterState,
    routing,
    handleNavigate,
  });

  useShowcaseMetadata(selectedBiz, currentPath, filterState.categoryFilter, filterState.hadayekZoneFilter);

  const publicBusinesses = useMemo(() => businesses.filter(isPublicBusiness), [businesses]);

  const isMapRoute = currentPath === '/' || currentPath === '/map';
  const isDirectoryRoute = isMapRoute || currentPath === '/search';

  return (
    <div
      className={
        isMapRoute
          ? "h-[100dvh] flex flex-col overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)] font-['Cairo',sans-serif]"
          : "min-h-screen lg:h-[100dvh] flex flex-col lg:overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)] font-['Cairo',sans-serif]"
      }
      style={{ direction: 'rtl' }}
    >
      <AppNavbar
        currentPath={currentPath}
        onNavigate={handleNavigate}
        searchQuery={filterState.searchQuery}
        onSearchChange={filterState.setSearchQuery}
        favoritesCount={favorites.length}
        activeLocation={filterState.cityFilter}
        onLocationChange={geo.handleLocationChange}
        onLocateMe={geo.handleRequestLocation}
        onFitAll={() => {
          window.dispatchEvent(new CustomEvent('map:fitAll'));
        }}
        onOpenAtlas={() => {
          window.dispatchEvent(new CustomEvent('atlas:open'));
        }}
        showFilterButton={isDirectoryRoute}
        hasActiveFilters={filterState.hasActiveFilters}
        onToggleFilters={() => setFilterSheetOpen(true)}
      />

      <DirectoryStatus />

      {filterSheetOpen && (
        <React.Suspense fallback={null}>
          <DirectoryFilterSheet
            isOpen={filterSheetOpen}
            onClose={() => setFilterSheetOpen(false)}
            businesses={publicBusinesses}
            effectiveCategory={effectiveMapCategoryFilter}
            filterState={filterState}
          />
        </React.Suspense>
      )}
      <main
        className={
          isMapRoute
            ? "flex-1 w-full min-h-0 relative overflow-hidden flex flex-col"
            : "flex-1 lg:min-h-0 lg:overflow-hidden pb-[env(safe-area-inset-bottom,0px)]"
        }
      >
        <React.Suspense
          fallback={
            <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3 p-8">
              <div className="w-8 h-8 rounded-full border-2 border-amber-500/20 border-t-amber-500 animate-spin" />
              <span className="text-xs font-bold text-slate-400">جاري التحميل...</span>
            </div>
          }
        >
          <DirectorySearchContext.Provider value={filterState.searchQuery !== filterState.deferredSearchQuery}>
            <PublicShowcaseViews
              currentPath={currentPath}
              filterState={filterState}
              publicBusinesses={publicBusinesses}
              effectiveMapCategoryFilter={effectiveMapCategoryFilter}
              effectiveSearchZone={effectiveSearchZone}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
              userCoords={geo.userCoords}
              isLocatingUser={geo.isLocatingUser}
              handleRequestLocation={geo.handleRequestLocation}
              handleNavigate={handleNavigate}
              mapCenter={geo.mapCenter}
              focusedMapBiz={focusedMapBiz}
              setFocusedMapBiz={setFocusedMapBiz}
              handleOpenBusiness={handleOpenBusiness}
              setSelectedVideoBiz={setSelectedVideoBiz}
              handleReshuffle={handleReshuffle}
              loading={loading}
            />
          </DirectorySearchContext.Provider>
        </React.Suspense>
      </main>

      {!isMapRoute && <AppFooter onNavigate={handleNavigate} />}

      <PublicShowcaseModals
        selectedBiz={selectedBiz}
        routingToken={routing.token}
        directoryLoad={directoryLoad}
        handleCloseBusiness={handleCloseBusiness}
        favorites={favorites}
        toggleFavorite={toggleFavorite}
        setSelectedVideoBiz={setSelectedVideoBiz}
        publicBusinesses={publicBusinesses}
        handleOpenBusiness={handleOpenBusiness}
        handleShowBusinessOnMap={handleShowBusinessOnMap}
        handleNavigate={handleNavigate}
        selectedVideoBiz={selectedVideoBiz}
        toastMessage={toastMessage}
      />

      <WhatsAppFloatingButton referralCode={referralCode} />
    </div>
  );
};
