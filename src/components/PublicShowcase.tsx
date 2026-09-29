import { useDirectoryNavigation } from '../hooks/useDirectoryNavigation';
import { useDirectoryLoad } from '../contexts/DirectoryLoadContext';
import { DirectoryStatus } from './DirectoryStatus';
import { parseFavorites } from '../services/catalogState';
import { isPublicBusiness } from '../shared/publicBusiness';
import { filterDirectoryBusinesses } from '../utils/directoryFiltering';
import React, { useState, useEffect, useMemo, useCallback, useDeferredValue } from 'react';
import { DirectorySearchContext } from '../contexts/DirectoryLoadContext';
import { parseActivitySearchIntent } from '../utils/activitySearchIntent';
import { Business } from '../types';
import {
  calculateDistanceKm,
  getBusinessOpenStatus,
  injectBusinessSchemaLd,
  shuffleBusinessesWithSeed,
  updatePageMetadata,
} from '../utils/directoryEnhancements';
import { getDirectoryPath, getPublicDirectoryUrl, getBusinessSlug } from '../utils/directoryUrl';
import { matchesCategorySelection, resolveCategorySelection } from '../utils/categoryMatcher';
import { matchesBusinessSearch, normalizeArabicText } from '../utils/arabicSearch';
import { isBusinessInHadayekZone } from '../utils/hadayekZoneHelper';
import { AppNavbar } from './layout/AppNavbar';
import { AppFooter } from './layout/AppFooter';
import { MobileBottomNav } from './layout/MobileBottomNav';
import { HomeView } from './views/HomeView';
import { MessageCircle } from 'lucide-react';

// Code-splitting via React.lazy to reduce initial JS payload for mobile Lighthouse performance
const SearchView = React.lazy(() => import('./views/SearchView').then(m => ({ default: m.SearchView })));
const MapView = React.lazy(() => import('./views/MapView').then(m => ({ default: m.MapView })));
const FavoritesView = React.lazy(() => import('./views/FavoritesView').then(m => ({ default: m.FavoritesView })));
const ForBusinessView = React.lazy(() => import('./views/ForBusinessView').then(m => ({ default: m.ForBusinessView })));
const BusinessPricingView = React.lazy(() => import('./views/BusinessPricingView').then(m => ({ default: m.BusinessPricingView })));
const AboutView = React.lazy(() => import('./views/AboutView').then(m => ({ default: m.AboutView })));
const MapSandboxView = React.lazy(() => import('./views/MapSandboxView').then(m => ({ default: m.MapSandboxView })));
const ActivityDetailModal = React.lazy(() => import('./activity/ActivityDetailModal').then(m => ({ default: m.ActivityDetailModal })));
const VideoPlayerModal = React.lazy(() => import('./VideoPlayerModal').then(m => ({ default: m.VideoPlayerModal })));

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
  isPreviewMode = false,
  referralCode,
  loading = false,
}) => {

  const routing=useDirectoryNavigation();
  const currentPath=routing.path;
  const directoryLoad=useDirectoryLoad();
  const handleNavigate=(newPath:string)=>{
    const url=new URL(newPath,window.location.origin);
    if((url.pathname==='/'||url.pathname==='/map')&&!url.searchParams.has('zone'))setHadayekZoneFilter('all');
    const cat=url.searchParams.get('cat');if(cat)handleCategoryChange(cat);
    routing.navigate(newPath);window.scrollTo({top:0,behavior:'smooth'});
  };

  // 2. Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [govFilter, setGovFilter] = useState<string>('الجيزة');
  const [cityFilter, setCityFilter] = useState<string>('حدائق الأهرام');
  const [hadayekZoneFilter, setHadayekZoneFilter] = useState<string>(() => {
    if (typeof window === 'undefined') return 'all';
    return new URLSearchParams(window.location.search).get('zone') || 'all';
  });
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>('all');
  const [openNowOnly, setOpenNowOnly] = useState<boolean>(false);
  const [hasRatingOnly, setHasRatingOnly] = useState<boolean>(false);
  const [hasVideoOnly, setHasVideoOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'default' | 'nearest' | 'newest' | 'has_video' | 'open_now' | 'alpha'>('default');
  // 🔀 Dynamic session seed generated fresh on every page load/reload
  const [shuffleSeed, setShuffleSeed] = useState<number>(() => Math.floor(Math.random() * 1000000) + 1);

  // 3. User Geolocation Coordinates
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocatingUser, setIsLocatingUser] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 🗺️ Active Map Center Coordinates (Default: Hadayek Al-Ahram)
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 29.9683, lng: 31.1002 });

  const handleCategoryChange = useCallback((nextCategory: string) => {
    const selection = resolveCategorySelection(nextCategory);
    setCategoryFilter(selection.mainCategoryId);
    setSubcategoryFilter(selection.subcategoryId);
  }, []);

  const activityIntent = useMemo(() => (currentPath === '/' || currentPath.startsWith('/map')) ? parseActivitySearchIntent(deferredSearchQuery) : null, [currentPath, deferredSearchQuery]);
  const effectiveSearchZone = activityIntent?.zone ?? hadayekZoneFilter;
  const effectiveMapCategoryFilter = activityIntent?.category ?? (subcategoryFilter !== 'all' ? subcategoryFilter : categoryFilter);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const categoryParam = params.get('cat');
    const subcategoryParam = params.get('subcat');
    if (categoryParam) {
      const selection = resolveCategorySelection(categoryParam);
      setCategoryFilter(selection.mainCategoryId);
      if (subcategoryParam) {
        const subSelection = resolveCategorySelection(subcategoryParam);
        setSubcategoryFilter(
          subSelection.mainCategoryId === selection.mainCategoryId ? subSelection.subcategoryId : selection.subcategoryId
        );
      } else {
        setSubcategoryFilter(selection.subcategoryId);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.location.pathname.startsWith('/search')) return;
    const url = new URL(window.location.href);
    if (categoryFilter === 'all') url.searchParams.delete('cat');
    else url.searchParams.set('cat', categoryFilter);
    if (subcategoryFilter === 'all') url.searchParams.delete('subcat');
    else url.searchParams.set('subcat', subcategoryFilter);
    window.history.replaceState(window.history.state, '', url.toString());
  }, [categoryFilter, subcategoryFilter]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((c) => (c === msg ? null : c));
    }, 3500);
  };

  const handleLocationChange = useCallback((locationName: string, coords?: { lat: number; lng: number }, gov?: string) => {
    setCityFilter(locationName);
    if (gov) {
      setGovFilter(gov);
    }
    if (locationName !== 'حدائق الأهرام') {
      setHadayekZoneFilter('all');
    }
    if (coords) {
      setMapCenter(coords);
    }
    showToast(`تم الانتقال إلى ${locationName} 📍`);
  }, []);

  const handleReshuffle = useCallback(() => {
    setShuffleSeed(Date.now() ^ Math.floor(Math.random() * 1000000));
    showToast('تمت إعادة خلط وترتيب الأنشطة عشوائياً 🔀');
  }, []);

  // Request GPS User Location for Proximity Sorting
  const handleRequestLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      showToast('المتصفح لا يدعم تحديد الموقع الجغرافي');
      return;
    }
    setIsLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocatingUser(false);
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setSortBy('nearest');
        showToast('تم تحديد موقعك بدقة! يتم الآن ترتيب الأنشطة من الأقرب إليك 📍');
      },
      () => {
        setIsLocatingUser(false);
        showToast('تعذر تحديد الموقع، يرجى تفعيل إذن الوصول للموقع في المتصفح');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // 4. Favorites Management
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('dalelak_user_favorites');
      return parseFavorites(saved);
    } catch {
      return [];
    }
  });

  useEffect(()=>{const sync=(event:StorageEvent)=>{if(event.key==='dalelak_user_favorites'||event.key===null)setFavorites(parseFavorites(event.newValue));};window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync);},[]);
  const toggleFavorite = async (bizId:string) => {
    const update=()=>{
      let current=favorites;let persisted=true;
      try{current=parseFavorites(localStorage.getItem('dalelak_user_favorites'));}catch{persisted=false;}
      const added=!current.includes(bizId);const next=added?[...current,bizId]:current.filter(id=>id!==bizId);
      try{localStorage.setItem('dalelak_user_favorites',JSON.stringify(next));}catch{persisted=false;}
      setFavorites(next);showToast(persisted?(added?'تمت الإضافة إلى المفضلة':'تمت الإزالة من المفضلة'):'تم التغيير لهذه الجلسة؛ تعذر حفظ المفضلة على الجهاز');
    };
    if(navigator.locks)await navigator.locks.request('dalelak-favorites',update);else update();
  };

  // Resolve selection from URL and current catalog instead of retaining a stale row copy.
  const selectedBiz=useMemo(()=>businesses.find(b=>isPublicBusiness(b)&&(b.id===routing.token||getBusinessSlug(b)===routing.token||b.customDirectoryUrl===routing.token))||null,[businesses,routing.token]);
  const [selectedVideoBiz,setSelectedVideoBiz]=useState<Business|null>(null);
  const [pinnedDirectBizId,setPinnedDirectBizId]=useState<string|null>(null);
  const [focusedMapBiz,setFocusedMapBiz]=useState<Business|null>(null);
  const isDirectLinkOpenRef=React.useRef(Boolean(initialBizId));
  useEffect(()=>{if(isDirectLinkOpenRef.current&&selectedBiz){isDirectLinkOpenRef.current=false;setPinnedDirectBizId(selectedBiz.id);handleCategoryChange(selectedBiz.category);}},[selectedBiz]);
  const handleShowBusinessOnMap=(biz:Business)=>{setHadayekZoneFilter('all');setFocusedMapBiz(biz);handleNavigate('/map');};
  const handleOpenBusiness=(biz:Business)=>{isDirectLinkOpenRef.current=false;routing.open(getDirectoryPath(biz));};
  const handleCloseBusiness=routing.close;

  // Dynamic Schema.org LocalBusiness SEO injection
  useEffect(() => {
    if (selectedBiz && selectedBiz.verificationStatus !== 'rejected') {
      injectBusinessSchemaLd(selectedBiz);
    } else {
      injectBusinessSchemaLd(null);
    }
  }, [selectedBiz]);

  // Dynamic Page Metadata (Title, Description, Canonical) Synchronization
  useEffect(() => {
    if (selectedBiz) {
      const name = selectedBiz.nameAr || selectedBiz.nameEn || 'نشاط معتمد';
      const loc = [selectedBiz.city, selectedBiz.governorate].filter(Boolean).join(' - ') || 'مصر';
      updatePageMetadata({
        title: `${name} | منصة دليلك المعتمدة`,
        description: selectedBiz.description || `${selectedBiz.category} في ${loc} - تواصل مباشر وتفاصيل الموقع الجغرافي على الخريطة المعتمدة.`,
        canonicalUrl: getPublicDirectoryUrl(selectedBiz),
      });
      return;
    }

    const cleanRoute = currentPath.toLowerCase().split('?')[0];
    const baseDomain = 'https://www.dalilaak.com';

    if (cleanRoute === '/search') {
      const catLabel = categoryFilter && categoryFilter !== 'all' ? ` — ${categoryFilter}` : '';
      const zoneLabel = hadayekZoneFilter && hadayekZoneFilter !== 'all' ? ` في منطقة (${hadayekZoneFilter})` : '';
      updatePageMetadata({
        title: `استكشف الأنشطة والخدمات المعتمدة${catLabel}${zoneLabel} | منصة دليلك`,
        description: `دليل المحلات والأنشطة والخدمات المعتمدة في حدائق الأهرام ومحافظات مصر${catLabel}${zoneLabel}. تفاصيل العناوين، أرقام التواصل وساعات العمل.`,
        canonicalUrl: `${baseDomain}/search`,
      });
    } else if (cleanRoute === '/' || cleanRoute === '/map') {
      updatePageMetadata({
        title: 'الخريطة التفاعلية والمواقع الموثقة | منصة دليلك',
        description: 'استكشف المحلات والأنشطة والخدمات الميدانية القريبة منك على الخريطة الحية المعتمدة في حدائق الأهرام ومصر.',
        canonicalUrl: `${baseDomain}/`,
      });
    } else if (cleanRoute === '/pricing') {
      updatePageMetadata({
        title: 'باقات النمو والتوثيق الميداني للأنشطة | منصة دليلك',
        description: 'اكتشف باقات توثيق واعتماد المحلات والشركات، الفواتير الإلكترونية، وبطاقات الدعم الميداني في منصة دليلك.',
        canonicalUrl: `${baseDomain}/pricing`,
      });
    } else if (cleanRoute === '/for-business') {
      updatePageMetadata({
        title: 'أضف نشاطك التجاري مجاناً | منصة دليلك',
        description: 'سجّل محلك أو خدمتك في منصة دليلك المعتمدة مجاناً واحصل على توثيق لموقعك على خرائط Google وتواصل مباشر مع العملاء.',
        canonicalUrl: `${baseDomain}/for-business`,
      });
    } else if (cleanRoute === '/about') {
      updatePageMetadata({
        title: 'عن منصة دليلك ورسالتها الميدانية | منصة دليلك',
        description: 'الرؤية والرسالة المؤسسية لمنظومة دليلك لتنظيم وتوثيق الوصول إلى الخدمات والأنشطة في محافظات مصر.',
        canonicalUrl: `${baseDomain}/about`,
      });
    } else if (cleanRoute === '/favorites') {
      updatePageMetadata({
        title: 'الأنشطة المحفوظة والمفضلة | منصة دليلك',
        description: 'قائمتك المفضلة من المحلات والأنشطة والخدمات المحفوظة للرجوع السريع إليها.',
        canonicalUrl: `${baseDomain}/favorites`,
      });
    } else {
      updatePageMetadata({
        title: 'منصة دليلك | دليل المحلات والأنشطة التجارية والخدمات في مصر',
        description: 'الدليل المعتمد لاستكشاف المحلات والأنشطة التجارية والطبية والحرفية، العناوين الدقيقة، أرقام التواصل المباشرة، والمواقع الموثقة على Google Maps.',
        canonicalUrl: `${baseDomain}/`,
      });
    }
  }, [selectedBiz, currentPath, categoryFilter, hadayekZoneFilter]);

  // Reset all filters handler
  const resetAllFilters = () => {
    isDirectLinkOpenRef.current = false;
    setPinnedDirectBizId(null);
    setSearchQuery('');
    setGovFilter('الجيزة');
    setCityFilter('حدائق الأهرام');
    setHadayekZoneFilter('all');
    setCategoryFilter('all');
    setSubcategoryFilter('all');
    setOpenNowOnly(false);
    setHasRatingOnly(false);
    setHasVideoOnly(false);
    setSortBy('default');
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    (govFilter !== 'الجيزة' && govFilter !== 'all') ||
    (cityFilter !== 'حدائق الأهرام' && cityFilter !== 'all') ||
    hadayekZoneFilter !== 'all' ||
    categoryFilter !== 'all' ||
    subcategoryFilter !== 'all' ||
    openNowOnly ||
    hasRatingOnly ||
    hasVideoOnly ||
    sortBy !== 'default';

  // 6. STRICT PUBLIC BUSINESSES PIPELINE
  const publicBusinesses = useMemo(() => {
    return businesses.filter(isPublicBusiness);
  }, [businesses]);

  // Filtered & Sorted Businesses
  const filteredBusinesses = useMemo(() => {
    const list = filterDirectoryBusinesses(publicBusinesses, {activityIntent,deferredSearchQuery,categoryFilter,subcategoryFilter,effectiveSearchZone,govFilter,cityFilter,openNowOnly,hasRatingOnly,hasVideoOnly});

    // Sorting Pipeline
    if (sortBy === 'nearest' && userCoords) {
      return [...list].sort((a, b) => {
        const distA = calculateDistanceKm(userCoords.lat, userCoords.lng, a.lat, a.lng);
        const distB = calculateDistanceKm(userCoords.lat, userCoords.lng, b.lat, b.lng);
        return distA - distB;
      });
    } else if (sortBy === 'newest') {
      return [...list].sort(
        (a, b) => new Date(b.createdDate || 0).getTime() - new Date(a.createdDate || 0).getTime()
      );
    } else if (sortBy === 'has_video') {
      return [...list].sort((a, b) => (b.videos?.length || 0) - (a.videos?.length || 0));
    } else if (sortBy === 'open_now') {
      return [...list].sort((a, b) => {
        const aOpen = getBusinessOpenStatus(a.workingHours).isOpen ? 1 : 0;
        const bOpen = getBusinessOpenStatus(b.workingHours).isOpen ? 1 : 0;
        return bOpen - aOpen;
      });
    } else if (sortBy === 'alpha') {
      return [...list].sort((a, b) => (a.nameAr || '').localeCompare(b.nameAr || '', 'ar'));
    }

    // Default Sorting ('default'):
    // 0. Direct Link Contextual Ordering:
    // If opened from a direct activity link, pin that exact business at #1,
    // and dynamically shuffle related businesses (same category/area) while maintaining fair exposure!
    if (pinnedDirectBizId && sortBy === 'default') {
      const pinnedBiz = list.find((b) => b.id === pinnedDirectBizId);
      if (pinnedBiz) {
        const rest = list.filter((b) => b.id !== pinnedDirectBizId);
        const sameCategoryAndCity: Business[] = [];
        const sameCategoryOtherCity: Business[] = [];
        const otherBusinesses: Business[] = [];

        rest.forEach((b) => {
          const isSameCat = b.category && pinnedBiz.category && b.category.trim() === pinnedBiz.category.trim();
          const isSameCity = b.city && pinnedBiz.city && b.city.trim().toLowerCase() === pinnedBiz.city.trim().toLowerCase();
          if (isSameCat && isSameCity) {
            sameCategoryAndCity.push(b);
          } else if (isSameCat) {
            sameCategoryOtherCity.push(b);
          } else {
            otherBusinesses.push(b);
          }
        });

        const shuffledSameCatCity = shuffleBusinessesWithSeed(sameCategoryAndCity, shuffleSeed);
        const shuffledSameCatOther = shuffleBusinessesWithSeed(sameCategoryOtherCity, shuffleSeed + 1);
        const shuffledOther = shuffleBusinessesWithSeed(otherBusinesses, shuffleSeed + 2);

        return [pinnedBiz, ...shuffledSameCatCity, ...shuffledSameCatOther, ...shuffledOther];
      }
    }

    // 1. If user has NOT applied any filter: Unbiased, dynamic per-load random shuffle (breaks static patterns)
    const hasUserFilters =
      deferredSearchQuery.trim() !== '' ||
      govFilter !== 'all' ||
      cityFilter !== 'all' ||
      effectiveSearchZone !== 'all' ||
      categoryFilter !== 'all' ||
      subcategoryFilter !== 'all' ||
      openNowOnly ||
      hasRatingOnly ||
      hasVideoOnly;

    if (!hasUserFilters) {
      return shuffleBusinessesWithSeed(list, shuffleSeed);
    }

    // 2. If user HAS applied a filter or search: Show most relevant and complete entries first
    return [...list].sort((a, b) => {
      const aFeatured = a.isFeatured || a.partnerStatus === 'certified' ? 1 : 0;
      const bFeatured = b.isFeatured || b.partnerStatus === 'certified' ? 1 : 0;
      if (bFeatured !== aFeatured) return bFeatured - aFeatured;

      const aHasPhoto = (a.photos?.length || 0) > 0 || !!a.coverPhoto ? 1 : 0;
      const bHasPhoto = (b.photos?.length || 0) > 0 || !!b.coverPhoto ? 1 : 0;
      if (bHasPhoto !== aHasPhoto) return bHasPhoto - aHasPhoto;

      const timeA = new Date(a.createdDate || 0).getTime();
      const timeB = new Date(b.createdDate || 0).getTime();
      if (timeA !== timeB) return timeB - timeA;

      return (a.id || '').localeCompare(b.id || '');
    });
  }, [
    publicBusinesses,
    activityIntent,
    deferredSearchQuery,
    govFilter,
    cityFilter,
    effectiveSearchZone,
    categoryFilter,
    subcategoryFilter,
    openNowOnly,
    hasRatingOnly,
    hasVideoOnly,
    sortBy,
    userCoords,
    shuffleSeed,
    pinnedDirectBizId,
  ]);

  // Route Dispatcher View
  const renderActiveView = () => {
    const cleanRoute = currentPath.toLowerCase().split('?')[0];

    switch (cleanRoute) {
      case '/':
      case '/map':
        return (
          <MapView
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            businesses={publicBusinesses}
            filteredBusinesses={filteredBusinesses}
            categoryFilter={effectiveMapCategoryFilter}
            onCategoryChange={handleCategoryChange}
            selectedZone={effectiveSearchZone}
            onZoneChange={setHadayekZoneFilter}
            sortBy={sortBy}
            onSortChange={setSortBy}
            openNowOnly={openNowOnly}
            onToggleOpenNow={() => setOpenNowOnly(!openNowOnly)}
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

      case '/sandbox':
      case '/map-sandbox':
      case '/temp':
        return <MapSandboxView onNavigate={handleNavigate} />;

      case '/atlas-home':
        return (
          <HomeView
            businesses={publicBusinesses}
            loading={loading}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedGov={govFilter}
            onGovChange={setGovFilter}
            selectedCity={cityFilter}
            onCityChange={setCityFilter}
            userCoords={userCoords}
            isLocatingUser={isLocatingUser}
            onRequestLocation={handleRequestLocation}
            onOpenBusiness={handleOpenBusiness}
            onToggleFavorite={toggleFavorite}
            favorites={favorites}
            onNavigate={handleNavigate}
            onOpenVideoModal={(b) => setSelectedVideoBiz(b)}
            shuffleSeed={shuffleSeed}
          />
        );

      case '/search':
        return (
          <SearchView
            filteredBusinesses={filteredBusinesses}
            allBusinesses={publicBusinesses}
            loading={loading}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedGov={govFilter}
            onGovChange={setGovFilter}
            selectedCity={cityFilter}
            onCityChange={setCityFilter}
            selectedZone={hadayekZoneFilter}
            onZoneChange={setHadayekZoneFilter}
            categoryFilter={categoryFilter}
            onCategoryChange={handleCategoryChange}
            subcategoryFilter={subcategoryFilter}
            onSubcategoryChange={setSubcategoryFilter}
            sortBy={sortBy}
            onSortChange={setSortBy}
            openNowOnly={openNowOnly}
            onToggleOpenNow={() => setOpenNowOnly(!openNowOnly)}
            hasRatingOnly={hasRatingOnly}
            onToggleHasRating={() => setHasRatingOnly(!hasRatingOnly)}
            hasVideoOnly={hasVideoOnly}
            onToggleHasVideo={() => setHasVideoOnly(!hasVideoOnly)}
            userCoords={userCoords}
            isLocatingUser={isLocatingUser}
            onRequestLocation={handleRequestLocation}
            onOpenBusiness={handleOpenBusiness}
            onToggleFavorite={toggleFavorite}
            favorites={favorites}
            onResetAllFilters={resetAllFilters}
            hasActiveFilters={hasActiveFilters}
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
        return <section className="p-8 text-center"><h1 className="text-xl font-bold">الصفحة غير موجودة</h1><p>تحقق من الرابط أو عُد إلى الدليل.</p><button className="min-h-11 underline" onClick={()=>handleNavigate('/search')}>العودة إلى البحث</button></section>;
    }
  };

  const isMapRoute = currentPath === '/' || currentPath === '/map';

  return (
    <div
      className={
        isMapRoute
          ? "h-[100dvh] flex flex-col overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)] font-['Cairo',sans-serif]"
          : "min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] font-['Cairo',sans-serif]"
      }
      style={{ direction: 'rtl' }}
    >
      {/* 1. Unified App Header */}
      <AppNavbar
        currentPath={currentPath}
        onNavigate={handleNavigate}
        favoritesCount={favorites.length}
        activeLocation={cityFilter}
        onLocationChange={handleLocationChange}
      />

      <DirectoryStatus />
      {/* 2. Main Dispatched View */}
      <main
        className={
          isMapRoute
            ? "flex-1 w-full min-h-0 relative overflow-hidden flex flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0"
            : "flex-1 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0"
        }
      >
        <React.Suspense fallback={
          <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3 p-8">
            <div className="w-8 h-8 rounded-full border-2 border-amber-500/20 border-t-amber-500 animate-spin" />
            <span className="text-xs font-bold text-slate-400">جاري التحميل...</span>
          </div>
        }>
          <DirectorySearchContext.Provider value={searchQuery !== deferredSearchQuery}>{renderActiveView()}</DirectorySearchContext.Provider>
        </React.Suspense>
      </main>

      {/* 3. Unified Institutional Footer */}
      {!isMapRoute && <AppFooter onNavigate={handleNavigate} />}

      {routing.token&&!selectedBiz&&<section role="status" className="fixed inset-x-4 top-24 z-50 bg-white border rounded-2xl shadow-xl p-6 text-center"><h2>{directoryLoad.pending?'جارٍ تحميل النشاط…':directoryLoad.error?'تعذر تحميل النشاط':'النشاط غير متاح'}</h2><p>قد يكون الرابط قديمًا أو النشاط غير منشور.</p>{directoryLoad.error&&<button onClick={()=>window.dispatchEvent(new Event('directory:retry'))}>إعادة المحاولة</button>}<button className="min-h-11 underline" onClick={handleCloseBusiness}>العودة للدليل</button></section>}
      {/* 4. Activity Details Modal */}
      {selectedBiz && (
        <React.Suspense fallback={null}>
          <ActivityDetailModal
            key={selectedBiz.id}
            business={selectedBiz}
            onClose={handleCloseBusiness}
            isFavorite={favorites.includes(selectedBiz.id)}
            onToggleFavorite={toggleFavorite}
            onOpenVideoModal={(b) => setSelectedVideoBiz(b)}
            allBusinesses={publicBusinesses}
            onSelectBusiness={handleOpenBusiness}
            onNavigateToBusinessClaim={(b) => {
              handleCloseBusiness();
              handleNavigate('/for-business');
            }}
            onShowOnMap={handleShowBusinessOnMap}
          />
        </React.Suspense>
      )}

      {/* 5. Video Player Modal */}
      {selectedVideoBiz && (
        <React.Suspense fallback={null}>
          <VideoPlayerModal
            business={selectedVideoBiz}
            onClose={() => setSelectedVideoBiz(null)}
          />
        </React.Suspense>
      )}

      {/* 6. Subtle Floating WhatsApp Action */}
      <a
        href={`https://wa.me/201556221141?text=${encodeURIComponent(
          'مرحباً دليلك، أود الاستفسار عن خدمة في الدليل' + (referralCode ? ` (كود: ${referralCode})` : '')
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        className="hidden md:flex fixed bottom-6 left-6 z-30 w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl items-center justify-center transition-transform hover:scale-110 active:scale-95 cursor-pointer"
        title="تواصل معنا عبر واتساب"
        aria-label="WhatsApp"
      >
        <MessageCircle className="w-5 h-5" />
      </a>

      {/* 7. Subtle Toast Notification */}
      {/* 8. Mobile PWA Sticky Bottom Navigation */}
      <MobileBottomNav
        currentPath={currentPath}
        onNavigate={handleNavigate}
        favoritesCount={favorites.length}
      />

      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 text-white text-xs font-black shadow-2xl border border-amber-500/30 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
