import { useState, useCallback } from 'react';
import { useShowcaseFilterState } from './useShowcaseFilterState';

export function useShowcaseGeolocation(
  filterState: ReturnType<typeof useShowcaseFilterState>,
  showToast: (msg: string) => void
) {
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocatingUser, setIsLocatingUser] = useState<boolean>(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 29.9683, lng: 31.1002 });

  const handleLocationChange = useCallback(
    (locationName: string, coords?: { lat: number; lng: number }, gov?: string) => {
      filterState.setCityFilter(locationName);
      if (gov) filterState.setGovFilter(gov);
      if (locationName !== 'حدائق الأهرام') filterState.setHadayekZoneFilter('all');
      if (coords) setMapCenter(coords);
      showToast(`تم الانتقال إلى ${locationName} 📍`);
    },
    [filterState, showToast]
  );

  const handleRequestLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      showToast('المتصفح لا يدعم تحديد الموقع الجغرافي');
      return;
    }
    setIsLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocatingUser(false);
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        filterState.setSortBy('nearest');
        showToast('تم تحديد موقعك بدقة! يتم الآن ترتيب الأنشطة من الأقرب إليك 📍');
      },
      () => {
        setIsLocatingUser(false);
        showToast('تعذر تحديد الموقع، يرجى تفعيل إذن الوصول للموقع في المتصفح');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [filterState, showToast]);

  return {
    userCoords,
    setUserCoords,
    isLocatingUser,
    mapCenter,
    setMapCenter,
    handleLocationChange,
    handleRequestLocation,
  };
}
