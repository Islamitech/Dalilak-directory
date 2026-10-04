export const GEO_HIGH_ACCURACY_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 12000,
};

export const GEO_FALLBACK_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 8000,
  maximumAge: 0,
};

export const GEO_ERRORS = {
  UNSUPPORTED: 'خدمة تحديد الموقع GPS غير مدعومة على هذا المتصفح.',
  FAILED_CONVERGENCE: 'تعذر الوصول إلى إشارة GPS دقيقة. يرجى تفعيل خدمة الموقع على جهازك أو التحديد يدوياً على الخريطة.',
  ERROR_GENERIC: 'حدث خطأ أثناء محاولة تشغيل خدمة الموقع.',
  TIMEOUT: 'انتهت مهلة البحث عن إشارة GPS دون الحصول على إشارة دقيقة. يرجى المحاولة مرة أخرى أو التحديد على الخريطة.',
} as const;

export function extractNormalizedCoordinates(pos: GeolocationPosition): { lat: number; lng: number; accuracy: number } {
  return {
    lat: Number(pos.coords.latitude.toFixed(6)),
    lng: Number(pos.coords.longitude.toFixed(6)),
    accuracy: Math.round(pos.coords.accuracy),
  };
}

export interface GeolocationSessionHandlers {
  onSuccess: (coords: { lat: number; lng: number; accuracy: number }) => void;
  onError: (errMsg: string) => void;
}

export function startGeolocationWatch(handlers: GeolocationSessionHandlers): () => void {
  if (!('geolocation' in navigator)) {
    handlers.onError(GEO_ERRORS.UNSUPPORTED);
    return () => {};
  }

  let isFinalized = false;
  let bestPosition: GeolocationPosition | null = null;
  let sampleCount = 0;
  let watchId: number | null = null;
  let timerId: ReturnType<typeof setTimeout> | null = null;

  const cleanup = () => {
    if (watchId !== null && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  const finalize = (pos: GeolocationPosition) => {
    if (isFinalized) return;
    isFinalized = true;
    cleanup();
    handlers.onSuccess(extractNormalizedCoordinates(pos));
  };

  try {
    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (isFinalized) return;
        sampleCount++;
        if (!bestPosition || pos.coords.accuracy < bestPosition.coords.accuracy) {
          bestPosition = pos;
        }
        if (pos.coords.accuracy <= 8 || sampleCount >= 4) {
          finalize(bestPosition || pos);
        } else if (sampleCount === 1) {
          if (timerId) clearTimeout(timerId);
          timerId = setTimeout(() => {
            if (!isFinalized && bestPosition) finalize(bestPosition);
          }, 4500);
        }
      },
      (err) => {
        if (isFinalized) return;
        console.warn('High precision GPS error, falling back:', err);
        if (bestPosition) {
          finalize(bestPosition);
        } else {
          navigator.geolocation.getCurrentPosition(
            finalize,
            () => {
              if (isFinalized) return;
              isFinalized = true;
              cleanup();
              handlers.onError(GEO_ERRORS.FAILED_CONVERGENCE);
            },
            GEO_FALLBACK_OPTIONS
          );
        }
      },
      GEO_HIGH_ACCURACY_OPTIONS
    );
  } catch {
    cleanup();
    handlers.onError(GEO_ERRORS.ERROR_GENERIC);
    return cleanup;
  }

  const overallTimer = setTimeout(() => {
    if (!isFinalized) {
      if (bestPosition) finalize(bestPosition);
      else {
        isFinalized = true;
        cleanup();
        handlers.onError(GEO_ERRORS.TIMEOUT);
      }
    }
  }, 21000);

  return () => {
    clearTimeout(overallTimer);
    cleanup();
  };
}
