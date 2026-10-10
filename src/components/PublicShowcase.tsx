import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useDirectoryNavigation } from '../app/router/useDirectoryNavigation';
import { useDirectoryLoad, DirectorySearchContext } from '../features/catalog';
import { DirectoryStatus } from './DirectoryStatus';
import { isPublicBusiness } from '../shared/publicBusiness';
import { parseActivitySearchIntent } from '../utils/activitySearchIntent';
import { Business } from '../types';
import { getBusinessSlug } from '../utils/directoryUrl';
import { AppNavbar } from './layout/AppNavbar';
import { AppFooter } from './layout/AppFooter';
import { WhatsAppFloatingButton } from './layout/WhatsAppFloatingButton';
import { useShowcaseFilterState } from './showcase/hooks/useShowcaseFilterState';
import { useDirectoryBusinesses } from './showcase/hooks/useDirectoryBusinesses';
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
  const [toastAction, setToastAction] = useState<{ label: string; onAction: () => void } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideToast = useCallback(() => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = null;
    setToastMessage(null);
    setToastAction(null);
  }, []);
  const showToast = useCallback((msg: string, undo?: () => void) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    setToastAction(
      undo
        ? {
            label: 'تراجع',
            onAction: () => {
              undo();
              hideToast();
            },
          }
        : null
    );
    toastTimerRef.current = setTimeout(hideToast, undo ? 5000 : 3500);
  }, [hideToast]);
  useEffect(() => () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
  }, []);

  const filterState = useShowcaseFilterState(currentPath);
  const { favorites, toggleFavorite } = useFavorites(showToast);
  const geo = useShowcaseGeolocation(filterState, showToast);

  const handleNavigate = useCallback((newPath: string) => {
    const url = new URL(newPath, window.location.origin);
    const directoryPaths = ['/', '/map', '/search'];
    const fromDirectory = directoryPaths.includes(window.location.pathname);
    const toDirectory = directoryPaths.includes(url.pathname);
    if (fromDirectory && toDirectory && !url.search) {
      const current = new URLSearchParams(window.location.search);
      for (const key of ['cat', 'subcat', 'zone', 'open', 'verified', 'sort', 'hide', 'q', 'search']) {
        const value = current.get(key);
        if (value && !url.searchParams.has(key)) url.searchParams.set(key, value);
      }
    }
    if ((url.pathname === '/' || url.pathname === '/map') && !url.searchParams.has('zone') && !fromDirectory) {
      filterState.setHadayekZoneFilter('all');
    }
    const cat = url.searchParams.get('cat');
    if (cat) filterState.handleCategoryChange(cat);
    routing.navigate(`${url.pathname}${url.search}`);
    if (!(fromDirectory && toDirectory)) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [filterState, routing]);

  const isDirectoryRoute = currentPath === '/' || currentPath === '/map' || currentPath === '/search';
  const activityIntent = useMemo(
    () => (isDirectoryRoute ? parseActivitySearchIntent(filterState.deferredSearchQuery) : null),
    [isDirectoryRoute, filterState.deferredSearchQuery]
  );
  const intentZone = activityIntent?.zone;
  const effectiveSearchZone = intentZone && intentZone !== 'all' ? intentZone : filterState.hadayekZoneFilter;
  const effectiveMapCategoryFilter = activityIntent?.category ?? (filterState.subcategoryFilter !== 'all' ? filterState.subcategoryFilter : filterState.categoryFilter);

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

  useShowcaseMetadata(selectedBiz, currentPath, filterState.categoryFilter, filterState.hadayekZoneFilter, filterState.searchQuery);

  const publicBusinesses = useMemo(() => businesses.filter(isPublicBusiness), [businesses]);

  const directoryBusinesses = useDirectoryBusinesses({
    publicBusinesses,
    activityIntent,
    deferredSearchQuery: filterState.deferredSearchQuery,
    categoryFilter: filterState.categoryFilter,
    subcategoryFilter: filterState.subcategoryFilter,
    effectiveSearchZone,
    openNowOnly: filterState.openNowOnly,
    verifiedOnly: filterState.verifiedOnly,
    hasRatingOnly: filterState.hasRatingOnly,
    hasVideoOnly: filterState.hasVideoOnly,
    sortBy: filterState.sortBy,
    userCoords: geo.userCoords,
    shuffleSeed: filterState.shuffleSeed,
    pinnedDirectBizId,
    directoryScope: filterState.directoryScope,
  });

  const isMapRoute = currentPath === '/' || currentPath === '/map';

  return (
    <div
      className={
        isMapRoute
          ? "h-[100dvh] flex flex-col overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)] font-['Cairo',sans-serif]"
          : "min-h-screen flex flex-col bg-transparent text-[var(--text-primary)] font-['Cairo',sans-serif]"
      }
      style={{ direction: 'rtl' }}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:start-3 focus:z-[80] focus:rounded-pill focus:bg-white focus:px-4 focus:py-2 focus:text-label focus:font-bold focus:text-slate-900 focus:shadow-lg"
      >
        تخطي إلى المحتوى
      </a>
      <AppNavbar
        currentPath={currentPath}
        onNavigate={handleNavigate}
        searchQuery={filterState.searchQuery}
        onSearchChange={filterState.setSearchQuery}
        favoritesCount={favorites.length}
        buildingSearchZone={filterState.hadayekZoneFilter}
        confineToHadayek={filterState.directoryScope === 'hadayek'}
        businesses={publicBusinesses}
        onSelectBusiness={handleOpenBusiness}
      />

      <DirectoryStatus showSync={isDirectoryRoute} />

      <main
        id="main"
        tabIndex={-1}
        className={
          isMapRoute
            ? "flex-1 w-full min-h-0 relative overflow-hidden flex flex-col"
            : "flex-1 pb-[env(safe-area-inset-bottom,0px)]"
        }
      >
        <React.Suspense fallback={<div className={isMapRoute ? 'h-full w-full bg-[var(--bg-primary)]' : 'min-h-[40vh]'} role="status" aria-live="polite" />}>
          <DirectorySearchContext.Provider value={filterState.searchQuery !== filterState.deferredSearchQuery}>
            <PublicShowcaseViews
              currentPath={currentPath}
              filterState={filterState}
              publicBusinesses={publicBusinesses}
              filteredBusinesses={directoryBusinesses}
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

      {!isMapRoute && (currentPath !== '/search' || directoryBusinesses.length > 0 || !directoryLoad.pending) && (
        <AppFooter onNavigate={handleNavigate} />
      )}

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
        toastAction={toastAction}
      />

      <WhatsAppFloatingButton referralCode={referralCode} />
    </div>
  );
};
