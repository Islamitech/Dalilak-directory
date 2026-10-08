import React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '../../shared/ui';

export interface MapStatusOverlayProps {
  mapScriptError: string | null;
  onRetryMapScript?: () => void;
  geoError: string | null;
  onClearGeoError?: () => void;
  mode: 'picker' | 'view';
  busy: boolean;
  showBusy: boolean;
  searchPending: boolean;
  directoryLoad: { pending: boolean; error: string };
  activeCategory?: string;
  activeZone?: string;
  matchingBusinessesCount: number;
}

export const MapStatusOverlay: React.FC<MapStatusOverlayProps> = ({
  mapScriptError,
  onRetryMapScript,
  geoError,
  onClearGeoError,
  mode,
  busy,
  showBusy,
  searchPending,
  directoryLoad,
  activeCategory,
  activeZone,
  matchingBusinessesCount,
}) => {
  return (
    <>
      {/* ⚠️ Leaflet Dynamic Script Load Failure Fallback */}
      {mapScriptError && (
        <div
          className="absolute inset-0 z-[1100] flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 text-center"
          dir="rtl"
          role="alert"
        >
          <div className="max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-red-200 flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xl font-bold select-none">
              ⚠️
            </div>
            <h3 className="font-bold text-slate-900 text-base">تعذر تحميل محرك الخريطة</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{mapScriptError}</p>
            {onRetryMapScript && (
              <Button variant="primary" onClick={onRetryMapScript} className="mt-2">
                إعادة المحاولة
              </Button>
            )}
          </div>
        </div>
      )}

      {/* 📍 GPS Timeout / Precision Error Feedback */}
      {geoError && (
        <div
          className="absolute top-20 inset-x-4 z-[1050] flex justify-center pointer-events-auto"
          role="alert"
          dir="rtl"
        >
          <div className="bg-slate-900/95 text-red-300 border border-red-500/40 rounded-2xl px-4 py-2.5 text-xs shadow-2xl flex items-center gap-3 max-w-md backdrop-blur-md">
            <span className="text-base select-none">📍</span>
            <span className="flex-1 leading-snug">{geoError}</span>
            {onClearGeoError && (
              <Button variant="secondary" size="sm" onClick={onClearGeoError}>
                إغلاق
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Status banner for busy/error */}
      {mode === 'view' && ((busy && showBusy) || (!busy && directoryLoad.error)) && (
        <div
          className="absolute bottom-5 inset-x-3 z-[850] flex justify-center pointer-events-none"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <div
            className="flex items-center gap-2 rounded-full bg-white/95 border border-slate-200 px-3 py-2 text-xs text-slate-700 shadow-sm"
            dir="rtl"
          >
            {busy ? (
              <>
                <Loader2 size={15} className="animate-spin motion-reduce:animate-none text-amber-600" />
                <span>{searchPending ? 'جارٍ تصفية الأنشطة…' : 'جارٍ تجهيز الأنشطة المعتمدة…'}</span>
              </>
            ) : (
              <>
                <span>{directoryLoad.error}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="pointer-events-auto text-amber-700"
                  onClick={() => window.dispatchEvent(new Event('directory:retry'))}
                >
                  إعادة المحاولة
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ⚠️ Network / Connection Error Toast Banner */}
      {directoryLoad.error && (
        <div className="absolute top-20 inset-x-4 sm:inset-x-auto sm:end-4 z-[950] pointer-events-auto transition-all animate-bounce-in">
          <div className="bg-red-950/90 backdrop-blur-md text-red-200 border border-red-500/50 rounded-xl px-4 py-2.5 text-xs font-bold shadow-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-red-400 text-sm">⚠️</span>
              <span>{directoryLoad.error}</span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.dispatchEvent(new CustomEvent('directory:retry'))}
            >
              إعادة المحاولة
            </Button>
          </div>
        </div>
      )}

      {/* ⚠️ Empty Category Notice Banner */}
      {mode === 'view' &&
        activeCategory &&
        activeCategory !== 'all' &&
        !directoryLoad.pending &&
        !searchPending &&
        !directoryLoad.error &&
        matchingBusinessesCount === 0 && (
          <div className="absolute bottom-5 inset-x-3 z-[850] flex justify-center pointer-events-none transition-all duration-300">
            <div className="bg-slate-900/90 backdrop-blur-md text-amber-300 border border-amber-500/40 rounded-full px-4 py-1.5 text-xs font-bold shadow-xl flex items-center gap-2 select-none">
              <span className="text-sm">🔍</span>
              <span>
                لا توجد أنشطة مسجلة في تصنيف &quot;{activeCategory}&quot;{' '}
                {activeZone && activeZone !== 'all' ? `بمنطقة ${activeZone}` : 'حالياً'}
              </span>
            </div>
          </div>
        )}
    </>
  );
};
