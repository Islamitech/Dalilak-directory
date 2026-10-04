import React from 'react';
import { Loader2 } from 'lucide-react';

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
              <button
                type="button"
                onClick={onRetryMapScript}
                className="mt-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-colors shadow-md active:scale-95 cursor-pointer"
              >
                إعادة المحاولة
              </button>
            )}
          </div>
        </div>
      )}

      {/* 📍 GPS Timeout / Precision Error Feedback */}
      {geoError && (
        <div
          className="absolute top-20 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-[1050] flex justify-center pointer-events-auto"
          role="alert"
          dir="rtl"
        >
          <div className="bg-slate-900/95 text-red-300 border border-red-500/40 rounded-2xl px-4 py-2.5 text-xs shadow-2xl flex items-center gap-3 max-w-md backdrop-blur-md">
            <span className="text-base select-none">📍</span>
            <span className="flex-1 leading-snug">{geoError}</span>
            {onClearGeoError && (
              <button
                type="button"
                onClick={onClearGeoError}
                className="px-2.5 py-1 bg-red-950 hover:bg-red-900 border border-red-700/60 rounded-lg text-white font-bold text-[11px] transition-colors cursor-pointer"
              >
                إغلاق
              </button>
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
                <button
                  type="button"
                  className="pointer-events-auto min-h-11 px-2 text-amber-700 font-bold"
                  onClick={() => window.dispatchEvent(new Event('directory:retry'))}
                >
                  إعادة المحاولة
                </button>
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
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('directory:retry'))}
              className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-400/40 rounded-lg px-2.5 py-1 text-[11px] font-black cursor-pointer transition-colors"
            >
              إعادة المحاولة
            </button>
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
          <div className="absolute bottom-5 start-16 end-3 sm:start-1/2 sm:end-auto sm:-translate-x-1/2 z-[850] pointer-events-none transition-all duration-300">
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
