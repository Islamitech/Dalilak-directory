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
import { Button } from '../../shared/ui';

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
}

const controlRow = 'map-ctl text-slate-600 hover:text-amber-700';
const dpadButton = 'w-8! h-8! min-h-8! text-slate-600 hover:text-amber-700';
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
}) => {
  return (
    <>
      {/* 🎯 Precision Center Reticle Crosshair (Overlay in center of screen for Picker) */}
      {centerReticleActive && mode === 'picker' && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-[1000]">
          <div className="relative flex items-center justify-center">
            {/* Outer Crosshair Ring */}
            <div className="w-16 h-16 rounded-pill border-2 border-amber-400/80 border-dashed animate-spin-slow flex items-center justify-center shadow-2xl bg-amber-500/10" />
            {/* Center Cross lines */}
            <div className="absolute w-24 h-0.5 bg-amber-400/90" />
            <div className="absolute h-24 w-0.5 bg-amber-400/90" />
            {/* Center Dot */}
            <div className="absolute w-3 h-3 rounded-pill bg-amber-400 border-2 border-slate-950 shadow-lg" />
          </div>
        </div>
      )}

      <div className="map-floating map-icon-controls absolute bottom-6 start-3 z-[1010] pointer-events-auto flex flex-col gap-2">
        <div className="flex flex-col">
          {/* 1. Locate Me (44px target) — the single amber-accented action */}
          {mode === 'view' && onLocate && (
            <Button
              variant="icon"
              onClick={onLocate}
              disabled={isLocating}
              aria-label="تحديد موقعي الحالي"
              aria-busy={isLocating}
              className={`${controlRow} ${isLocating ? 'bg-amber-100/80 text-amber-700' : 'text-amber-600'}`}
              title="موقعي"
            >
              {isLocating ? <Loader2 className="w-5 h-5 animate-spin motion-reduce:animate-none" /> : <LocateFixed className="w-5 h-5" />}
            </Button>
          )}

          {mode === 'view' && onLocate && groupDivider}

          {/* 2. Fit All / Reset Position */}
          <Button
            variant="icon"
            onClick={handleResetPosition}
            aria-label="عرض الكل وإعادة ضبط موضع الخريطة"
            className={controlRow}
            title="عرض الكل"
          >
            <RotateCcw className="w-5 h-5" />
          </Button>

          {groupDivider}

          {/* 3. Zoom In / Out group */}
          <Button
            variant="icon"
            onClick={handleZoomIn}
            aria-label="تكبير الخريطة"
            className={controlRow}
            title="تكبير الخريطة (+)"
          >
            <ZoomIn className="w-5 h-5 stroke-[2.5]" />
          </Button>
          <Button
            variant="icon"
            onClick={handleZoomOut}
            aria-label="تصغير الخريطة"
            className={controlRow}
            title="تصغير الخريطة (-)"
          >
            <ZoomOut className="w-5 h-5 stroke-[2.5]" />
          </Button>

          {/* Picker-only controls follow the same recipe */}
          {mode === 'picker' && (
            <>
              {groupDivider}
              <Button
                variant="icon"
                onClick={handlePinCenterOfMap}
                aria-label="تثبيت الدبوس في منتصف الخريطة"
                className={controlRow}
                title="تثبيت الدبوس في منتصف شاشة الخريطة الحالية"
              >
                <Target className="w-5 h-5 stroke-[2.5]" />
              </Button>
              <Button
                variant="icon"
                onClick={() => setCenterReticleActive(!centerReticleActive)}
                aria-label="تفعيل أو إلغاء علامة التصويب الدقيقة"
                aria-pressed={centerReticleActive}
                className={`${controlRow} ${
                  centerReticleActive ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-md shadow-amber-500/30 hover:from-amber-400 hover:to-amber-600 hover:text-white' : ''
                }`}
                title="تفعيل/إلغاء علامة التصويب الدقيقة"
              >
                <Crosshair className="w-5 h-5 stroke-[2.5]" />
              </Button>
            </>
          )}
        </div>

        {/* D-PAD Directional Pan (Picker only) — same glass language, kept clear of the stack above */}
        {mode === 'picker' && (
          <div className="flex flex-col items-center gap-1">
            <span className="text-caption font-bold text-amber-600 uppercase tracking-tighter">تحريك دقيق</span>

            <Button
              variant="icon"
              onClick={() => handlePan('up')}
              aria-label="تحريك لأعلى"
              className={dpadButton}
              title="تحريك لأعلى"
            >
              <ChevronUp className="w-4 h-4 stroke-[3]" />
            </Button>

            <div className="flex items-center gap-1">
              <Button
                variant="icon"
                onClick={() => handlePan('left')}
                aria-label="تحريك لليسار"
                className={dpadButton}
                title="تحريك لليسار"
              >
                <ChevronLeft className="w-4 h-4 stroke-[3]" />
              </Button>

              <div className="w-5 h-5 rounded-md bg-amber-500/15 text-amber-600 flex items-center justify-center text-caption font-bold">
                <Crosshair className="w-3 h-3" />
              </div>

              <Button
                variant="icon"
                onClick={() => handlePan('right')}
                aria-label="تحريك لليمين"
                className={dpadButton}
                title="تحريك لليمين"
              >
                <ChevronRight className="w-4 h-4 stroke-[3]" />
              </Button>
            </div>

            <Button
              variant="icon"
              onClick={() => handlePan('down')}
              aria-label="تحريك لأسفل"
              className={dpadButton}
              title="تحريك لأسفل"
            >
              <ChevronDown className="w-4 h-4 stroke-[3]" />
            </Button>
          </div>
        )}
      </div>
    </>
  );
};
