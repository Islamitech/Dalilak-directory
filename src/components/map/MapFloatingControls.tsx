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

const controlRow =
  'map-ctl w-11 h-11 rounded-xl flex items-center justify-center text-slate-600 transition-all cursor-pointer hover:bg-amber-50 hover:text-amber-700 active:scale-95 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500';
const groupDivider = <div aria-hidden="true" className="h-px bg-slate-200/80 mx-2.5 my-0.5" />;

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

      {/* 📊 Live Map Stats Badge - Pulsing dot with live count (.map-stats at top-left) */}
      {mode === 'view' && businessesCount !== undefined && businessesCount > 0 && (
        <div className="map-stats absolute top-16 end-3 sm:top-3.5 sm:end-4 z-[1010] pointer-events-auto bg-white/90 border border-slate-200/70 rounded-full px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-lg flex items-center gap-2 select-none backdrop-blur-md">
          <span className="dot w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.25)] animate-pulse" />
          <span>{businessesCount} نشاط موثق</span>
        </div>
      )}

      {/* FLOATING CONTROLS — one frosted-glass group (.map-floating at top-right).
          Unified recipe: white glass container, slate icons, amber accent only
          for the GPS action and active states (Google/Apple Maps grouping). */}
      <div className="map-floating map-icon-controls absolute top-16 start-3 sm:top-3.5 sm:start-4 z-[1010] pointer-events-auto flex flex-col gap-2">
        <div className="flex flex-col rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/70 shadow-lg p-1">
          {/* 1. Locate Me (44px target) — the single amber-accented action */}
          {mode === 'view' && onLocate && (
            <button
              type="button"
              onClick={onLocate}
              disabled={isLocating}
              aria-label="تحديد موقعي الحالي"
              aria-busy={isLocating}
              className={`${controlRow} ${isLocating ? 'bg-amber-100/80 text-amber-700' : 'text-amber-600'}`}
              title="موقعي"
            >
              {isLocating ? <Loader2 className="w-5 h-5 animate-spin motion-reduce:animate-none" /> : <LocateFixed className="w-5 h-5" />}
            </button>
          )}

          {mode === 'view' && onLocate && groupDivider}

          {/* 2. Fit All / Reset Position */}
          <button
            type="button"
            onClick={handleResetPosition}
            aria-label="عرض الكل وإعادة ضبط موضع الخريطة"
            className={controlRow}
            title="عرض الكل"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {groupDivider}

          {/* 3. Zoom In / Out group */}
          <button
            type="button"
            onClick={handleZoomIn}
            aria-label="تكبير الخريطة"
            className={controlRow}
            title="تكبير الخريطة (+)"
          >
            <ZoomIn className="w-5 h-5 stroke-[2.5]" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            aria-label="تصغير الخريطة"
            className={controlRow}
            title="تصغير الخريطة (-)"
          >
            <ZoomOut className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* Picker-only controls follow the same recipe */}
          {mode === 'picker' && (
            <>
              {groupDivider}
              <button
                type="button"
                onClick={handlePinCenterOfMap}
                aria-label="تثبيت الدبوس في منتصف الخريطة"
                className={controlRow}
                title="تثبيت الدبوس في منتصف شاشة الخريطة الحالية"
              >
                <Target className="w-5 h-5 stroke-[2.5]" />
              </button>
              <button
                type="button"
                onClick={() => setCenterReticleActive(!centerReticleActive)}
                aria-label="تفعيل أو إلغاء علامة التصويب الدقيقة"
                aria-pressed={centerReticleActive}
                className={`${controlRow} ${
                  centerReticleActive ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-md shadow-amber-500/30 hover:from-amber-400 hover:to-amber-600 hover:text-white' : ''
                }`}
                title="تفعيل/إلغاء علامة التصويب الدقيقة"
              >
                <Crosshair className="w-5 h-5 stroke-[2.5]" />
              </button>
            </>
          )}
        </div>

        {/* D-PAD Directional Pan (Picker only) — same glass language, kept clear of the stack above */}
        {mode === 'picker' && (
          <div className="bg-white/90 backdrop-blur-md border border-slate-200/70 p-1.5 rounded-2xl shadow-lg flex flex-col items-center gap-1">
            <span className="text-[9px] font-bold text-amber-600 uppercase tracking-tighter">تحريك دقيق</span>

            <button
              type="button"
              onClick={() => handlePan('up')}
              aria-label="تحريك لأعلى"
              className="w-8 h-8 rounded-lg text-slate-600 transition-colors hover:bg-amber-50 hover:text-amber-700 flex items-center justify-center cursor-pointer"
              title="تحريك لأعلى"
            >
              <ChevronUp className="w-4 h-4 stroke-[3]" />
            </button>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handlePan('left')}
                aria-label="تحريك لليسار"
                className="w-8 h-8 rounded-lg text-slate-600 transition-colors hover:bg-amber-50 hover:text-amber-700 flex items-center justify-center cursor-pointer"
                title="تحريك لليسار"
              >
                <ChevronLeft className="w-4 h-4 stroke-[3]" />
              </button>

              <div className="w-5 h-5 rounded-md bg-amber-500/15 text-amber-600 flex items-center justify-center text-[10px] font-bold">
                <Crosshair className="w-3 h-3" />
              </div>

              <button
                type="button"
                onClick={() => handlePan('right')}
                aria-label="تحريك لليمين"
                className="w-8 h-8 rounded-lg text-slate-600 transition-colors hover:bg-amber-50 hover:text-amber-700 flex items-center justify-center cursor-pointer"
                title="تحريك لليمين"
              >
                <ChevronRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => handlePan('down')}
              aria-label="تحريك لأسفل"
              className="w-8 h-8 rounded-lg text-slate-600 transition-colors hover:bg-amber-50 hover:text-amber-700 flex items-center justify-center cursor-pointer"
              title="تحريك لأسفل"
            >
              <ChevronDown className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        )}
      </div>
    </>
  );
};
