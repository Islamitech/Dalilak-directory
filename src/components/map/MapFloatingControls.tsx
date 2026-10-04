import React from 'react';
import {
  ZoomIn,
  ZoomOut,
  Target,
  Crosshair,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LocateFixed,
  Loader2,
} from 'lucide-react';

import { MapTileLayerType } from './constants/mapConstants';

export interface MapFloatingControlsProps {
  mode: 'picker' | 'view';
  centerReticleActive: boolean;
  setCenterReticleActive: (active: boolean) => void;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handlePinCenterOfMap: () => void;
  handleResetPosition: () => void;
  handlePan: (direction: 'up' | 'down' | 'left' | 'right') => void;
  tileLayer: MapTileLayerType;
  switchTileLayer: (layer: MapTileLayerType) => void;
  onLocate?: () => void;
  isLocating?: boolean;
  businessesCount?: number;
}

export const MapFloatingControls: React.FC<MapFloatingControlsProps> = ({
  mode,
  centerReticleActive,
  setCenterReticleActive,
  handleZoomIn,
  handleZoomOut,
  handlePinCenterOfMap,
  handleResetPosition,
  handlePan,
  onLocate,
  isLocating = false,
  businessesCount,
}) => {
  return (
    <>
      {/* 🎯 Precision Center Reticle Crosshair (Overlay in center of screen for Picker) */}
      {centerReticleActive && mode === 'picker' && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-[1000]">
          <div className="relative flex items-center justify-center">
            {/* Outer Crosshair Ring */}
            <div className="w-16 h-16 rounded-full border-2 border-amber-400/80 border-dashed animate-spin-slow flex items-center justify-center shadow-2xl bg-amber-500/10" />
            {/* Center Cross lines */}
            <div className="absolute w-24 h-0.5 bg-amber-400/90" />
            <div className="absolute h-24 w-0.5 bg-amber-400/90" />
            {/* Center Dot */}
            <div className="absolute w-3 h-3 rounded-full bg-amber-400 border-2 border-slate-950 shadow-lg" />
          </div>
        </div>
      )}

      {/* 📊 Live Map Stats Badge - Pulsing dot with live count */}
      {mode === 'view' && businessesCount !== undefined && businessesCount > 0 && (
        <div className="map-stats absolute top-28 start-3 sm:top-20 sm:start-5 z-[1010] pointer-events-auto bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-full px-3.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-md flex items-center gap-2 select-none backdrop-blur-md">
          <span className="dot w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.25)] animate-pulse" />
          <span>{businessesCount} نشاط موثق</span>
        </div>
      )}

      {/* FLOATING CONTROLS TOOLBAR OVER MAP */}
      <div className="map-floating map-icon-controls absolute top-[7.5rem] end-2 sm:top-20 sm:end-5 lg:top-4 lg:end-4 flex flex-col gap-2 z-[1010]">
        {/* 1. Locate Me Button (44px target) */}
        {mode === 'view' && onLocate && (
          <button
            type="button"
            onClick={onLocate}
            disabled={isLocating}
            aria-label="تحديد موقعي الحالي"
            aria-busy={isLocating}
            className="map-btn min-w-[44px] min-h-[44px] bg-white/95 dark:bg-slate-900/95 text-amber-700 dark:text-amber-400 hover:bg-amber-500 hover:text-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md flex items-center justify-center disabled:opacity-60 transition-all cursor-pointer active:scale-95"
            title="موقعي"
          >
            {isLocating ? <Loader2 className="w-5 h-5 animate-spin motion-reduce:animate-none" /> : <LocateFixed className="w-5 h-5" />}
          </button>
        )}

        {/* 2. Fit All / Reset Position Button (44px target) */}
        <button
          type="button"
          onClick={handleResetPosition}
          aria-label="عرض الكل وإعادة ضبط موضع الخريطة"
          className="map-btn min-w-[44px] min-h-[44px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md hover:bg-amber-500 hover:text-slate-950 text-slate-700 dark:text-slate-200 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md transition-all flex items-center justify-center active:scale-95 cursor-pointer"
          title="عرض الكل"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        {/* 3. Zoom In (+) Button (44px target) */}
        <button
          type="button"
          onClick={handleZoomIn}
          aria-label="تكبير الخريطة"
          className="map-btn min-w-[44px] min-h-[44px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md hover:bg-amber-500 text-slate-700 hover:text-slate-950 dark:text-slate-200 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md transition-all font-bold flex items-center justify-center active:scale-95 cursor-pointer"
          title="تكبير الخريطة (+)"
        >
          <ZoomIn className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* 4. Zoom Out (-) Button (44px target) */}
        <button
          type="button"
          onClick={handleZoomOut}
          aria-label="تصغير الخريطة"
          className="map-btn min-w-[44px] min-h-[44px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md hover:bg-amber-500 text-slate-700 hover:text-slate-950 dark:text-slate-200 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md transition-all font-bold flex items-center justify-center active:scale-95 cursor-pointer"
          title="تصغير الخريطة (-)"
        >
          <ZoomOut className="w-5 h-5 stroke-[2.5]" />
        </button>

        {mode === 'picker' && (
          <button
            type="button"
            onClick={handlePinCenterOfMap}
            aria-label="تثبيت الدبوس في منتصف الخريطة"
            className="min-w-[44px] min-h-[44px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md hover:bg-amber-500 text-amber-600 hover:text-slate-950 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md transition-all font-bold flex items-center justify-center active:scale-95 cursor-pointer"
            title="تثبيت الدبوس في منتصف شاشة الخريطة الحالية"
          >
            <Target className="w-5 h-5 stroke-[2.5]" />
          </button>
        )}

        {mode === 'picker' && (
          <button
            type="button"
            onClick={() => setCenterReticleActive(!centerReticleActive)}
            aria-label="تفعيل أو إلغاء علامة التصويب الدقيقة"
            className={`min-w-[44px] min-h-[44px] p-2.5 rounded-2xl border shadow-md transition-all font-bold flex items-center justify-center active:scale-95 cursor-pointer ${
              centerReticleActive
                ? 'bg-amber-500 text-slate-950 border-amber-400'
                : 'bg-white/95 dark:bg-slate-900/95 hover:bg-amber-50 text-amber-600 border-slate-200 dark:border-slate-800'
            }`}
            title="تفعيل/إلغاء علامة التصويب الدقيقة"
          >
            <Crosshair className="w-5 h-5 stroke-[2.5]" />
          </button>
        )}
      </div>

      {/* D-PAD Directional Pan Movement Controls (Only for Picker Mode) */}
      {mode === 'picker' && (
        <div className="absolute top-20 start-3 bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 p-1.5 rounded-2xl shadow-xl backdrop-blur-md z-[900] flex flex-col items-center gap-1">
          <span className="text-[9px] font-bold text-amber-600 uppercase tracking-tighter">تحريك دقيق</span>

          <button
            type="button"
            onClick={() => handlePan('up')}
            aria-label="تحريك لأعلى"
            className="bg-slate-50 dark:bg-slate-800 hover:bg-amber-500 text-slate-700 hover:text-slate-950 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            title="تحريك لأعلى"
          >
            <ChevronUp className="w-4 h-4 stroke-[3]" />
          </button>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handlePan('left')}
              aria-label="تحريك لليسار"
              className="bg-slate-50 dark:bg-slate-800 hover:bg-amber-500 text-slate-700 hover:text-slate-950 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              title="تحريك لليسار"
            >
              <ChevronLeft className="w-4 h-4 stroke-[3]" />
            </button>

            <div className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-600 flex items-center justify-center text-[10px] font-bold">
              <Crosshair className="w-3 h-3" />
            </div>

            <button
              type="button"
              onClick={() => handlePan('right')}
              aria-label="تحريك لليمين"
              className="bg-slate-50 dark:bg-slate-800 hover:bg-amber-500 text-slate-700 hover:text-slate-950 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              title="تحريك لليمين"
            >
              <ChevronRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => handlePan('down')}
            aria-label="تحريك لأسفل"
            className="bg-slate-50 dark:bg-slate-800 hover:bg-amber-500 text-slate-700 hover:text-slate-950 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            title="تحريك لأسفل"
          >
            <ChevronDown className="w-4 h-4 stroke-[3]" />
          </button>
        </div>
      )}
    </>
  );
};
