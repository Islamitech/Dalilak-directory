import React, { useState, useEffect, useMemo } from 'react';
import { Car, Footprints, Navigation, X } from 'lucide-react';
import { HADAYEK_OFFICIAL_GATES } from '../../../data/hadayekDistrictsGeoData';
import { fetchRealRoadRoute, RealRoadRouteResult } from '../../../utils/hadayekRouting';
import {
  NavigationTarget,
  computeRouteStats,
  getGoogleVoiceNavUrl,
} from '../model/directionsModel';

export interface InAppNavigationDrawerProps {
  target: NavigationTarget | null;
  onClose: () => void;
  onUpdateRoute?: (route: {
    origin: { lat: number; lng: number; label: string };
    destination: { lat: number; lng: number; label: string };
    points?: [number, number][];
    distanceMeters?: number;
    durationSeconds?: number;
  } | null) => void;
}

export const InAppNavigationDrawer: React.FC<InAppNavigationDrawerProps> = ({
  target,
  onClose,
  onUpdateRoute,
}) => {
  const [originType, setOriginType] = useState<'gps' | 'gate'>('gps');
  const [selectedGateId, setSelectedGateId] = useState<string>('gate_1');
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isGettingGps, setIsGettingGps] = useState<boolean>(false);
  const [realRouteData, setRealRouteData] = useState<RealRoadRouteResult | null>(null);

  const fetchGpsLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('خاصية تحديد الموقع الجغرافي غير مدعومة في متصفحك.');
      setOriginType('gate');
      return;
    }

    setIsGettingGps(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsGettingGps(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setGpsError('تعذر تحديد موقعك الحالي عبر GPS. يرجى تفعيل إذن الموقع أو اختيار نقطة البداية يدوياً.');
        setIsGettingGps(false);
        setOriginType('gate');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  useEffect(() => {
    if (originType === 'gps' && !gpsCoords && !isGettingGps) {
      fetchGpsLocation();
    }
  }, [originType]);

  const currentOrigin = useMemo<{ lat: number; lng: number; label: string } | null>(() => {
    if (originType === 'gps' && gpsCoords) {
      return {
        lat: gpsCoords.lat,
        lng: gpsCoords.lng,
        label: 'موقعي الجغرافي الحالي (GPS)',
      };
    }
    if (originType === 'gate') {
      const gate = HADAYEK_OFFICIAL_GATES.find((g) => g.id === selectedGateId) || HADAYEK_OFFICIAL_GATES[0];
      return {
        lat: gate.lat,
        lng: gate.lng,
        label: gate.popularNameAr,
      };
    }
    return null;
  }, [originType, gpsCoords, selectedGateId]);

  useEffect(() => {
    let isMounted = true;
    if (!currentOrigin || !target) {
      setRealRouteData(null);
      if (onUpdateRoute) onUpdateRoute(null);
      return;
    }

    // Draw the straight line immediately; upgrade to the real road geometry once it arrives.
    if (onUpdateRoute) {
      onUpdateRoute({
        origin: currentOrigin,
        destination: { lat: target.lat, lng: target.lng, label: target.title },
      });
    }

    fetchRealRoadRoute(currentOrigin, { lat: target.lat, lng: target.lng }).then((route) => {
      if (!isMounted) return;
      if (route) {
        setRealRouteData(route);
        if (onUpdateRoute) {
          onUpdateRoute({
            origin: currentOrigin,
            destination: { lat: target.lat, lng: target.lng, label: target.title },
            points: route.points,
            distanceMeters: route.distanceMeters,
            durationSeconds: route.durationSeconds,
          });
        }
      } else {
        setRealRouteData(null);
        if (onUpdateRoute) {
          onUpdateRoute({
            origin: currentOrigin,
            destination: { lat: target.lat, lng: target.lng, label: target.title },
          });
        }
      }
    });

    return () => { isMounted = false; };
  }, [currentOrigin, target]);

  const stats = useMemo(() => computeRouteStats(currentOrigin, target, realRouteData), [currentOrigin, target, realRouteData]);

  const handleEndNavigation = () => {
    if (onUpdateRoute) onUpdateRoute(null);
    onClose();
  };

  const handleOpenGoogleMaps = () => {
    if (!currentOrigin || !target) return;
    const url = getGoogleVoiceNavUrl(currentOrigin, target);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (!target) return null;

  // No sheet while navigating: the map and the route stay fully visible.
  // Only a tiny pill with the essentials and an exit button remains.
  return (
    <div
      role="status"
      aria-label={`التوجيه إلى ${target.title}`}
      dir="rtl"
      className="dl-navpill pointer-events-auto font-['Cairo',sans-serif]"
    >
      <Navigation className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
      <span className="dl-navpill-t">
        {stats ? stats.distanceText : 'جارٍ تحديد المسار…'}
      </span>
      {stats && (
        <span className="dl-navpill-c" title="بالسيارة">
          <Car className="inline w-3 h-3 me-0.5" aria-hidden="true" />
          {stats.drivingMinutes} د
        </span>
      )}
      {stats && (
        <span className="dl-navpill-s" title="مشياً على الأقدام">
          <Footprints className="inline w-3 h-3 me-0.5" aria-hidden="true" />
          {stats.walkingMinutes} د
        </span>
      )}
      <button
        type="button"
        onClick={handleEndNavigation}
        aria-label="إنهاء الملاحة"
        title="إنهاء الملاحة"
        className="dl-navpill-x"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};