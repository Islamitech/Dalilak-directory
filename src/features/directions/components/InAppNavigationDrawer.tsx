import React, { useState, useEffect, useMemo } from 'react';
import { Navigation, ExternalLink } from 'lucide-react';
import { HADAYEK_OFFICIAL_GATES } from '../../../data/hadayekDistrictsGeoData';
import { fetchRealRoadRoute, RealRoadRouteResult } from '../../../utils/hadayekRouting';
import { Drawer, IconButton } from '../../../shared/ui';
import {
  NavigationTarget,
  computeRouteStats,
  getGoogleVoiceNavUrl,
} from '../model/directionsModel';
import { NavigationOriginSelector } from './NavigationOriginSelector';
import { NavigationStatsBar } from './NavigationStatsBar';

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
  if (!target) return null;

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
    if (!currentOrigin) return;
    const url = getGoogleVoiceNavUrl(currentOrigin, target);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Drawer
      isOpen={!!target}
      onClose={handleEndNavigation}
      position="bottom"
      hideDefaultHeader
      aria-label={`التوجيه إلى ${target.title}`}
      className="!border-2 !border-slate-200/90 !rounded-t-2xl sm:!rounded-3xl sm:bottom-4 sm:inset-x-4 max-w-2xl mx-auto shadow-2xl !max-h-[85vh] sm:!max-h-[80vh]"
      contentClassName="p-4 sm:p-5 overflow-y-auto space-y-3.5 font-['Cairo',sans-serif]"
    >
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center font-black shadow-md shrink-0">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black bg-amber-100 text-amber-950 px-2 py-0.5 rounded-full border border-amber-300">
                الملاحة الذكية
              </span>
              <span className="text-[10px] font-bold text-slate-500">
                {target.type === 'building' ? '🏢 مبنى' : '🏪 منشأة معتمدة'}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
              التوجيه إلى: {target.title}
            </h3>
          </div>
        </div>

        <IconButton
          aria-label="إنهاء الملاحة"
          onClick={handleEndNavigation}
          size="sm"
          variant="ghost"
          className="!w-8 !h-8 !rounded-full !bg-slate-100 hover:!bg-slate-200 !text-slate-500"
          icon={<span className="text-sm font-black">✕</span>}
        />
      </div>

      <NavigationOriginSelector
        originType={originType}
        setOriginType={setOriginType}
        selectedGateId={selectedGateId}
        setSelectedGateId={setSelectedGateId}
        isGettingGps={isGettingGps}
        gpsError={gpsError}
        gpsCoords={gpsCoords}
        onFetchGps={fetchGpsLocation}
      />

      {stats && <NavigationStatsBar stats={stats} />}

      <div className="flex flex-col sm:flex-row gap-2 pt-1 border-t border-slate-100 text-xs font-black">
        <button
          type="button"
          onClick={handleOpenGoogleMaps}
          disabled={!currentOrigin}
          className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          title="تتبع المسار مباشرة على خرائط Google"
        >
          <ExternalLink className="w-4 h-4" />
          <span>تتبع المسار مباشرة (افتح خرائط Google)</span>
        </button>

        <button
          type="button"
          onClick={handleEndNavigation}
          className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer border border-slate-200"
        >
          <span>إنهاء الملاحة</span>
        </button>
      </div>
    </Drawer>
  );
};
