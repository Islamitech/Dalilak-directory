import { useState, useRef, useEffect, useCallback } from 'react';
import {
  GEO_ERRORS,
  startGeolocationWatch,
} from '../../../features/map';

export interface UseMapGeolocationProps {
  updateSelectedPosition: (lat: number, lng: number, flyTo?: boolean, customZoom?: number) => Promise<void>;
  setGpsAccuracy: (acc: number | null) => void;
}

export const useMapGeolocation = ({
  updateSelectedPosition,
  setGpsAccuracy,
}: UseMapGeolocationProps) => {
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const updateSelectedPositionRef = useRef(updateSelectedPosition);
  const setGpsAccuracyRef = useRef(setGpsAccuracy);

  const clearGeoError = useCallback(() => setGeoError(null), []);

  useEffect(() => {
    updateSelectedPositionRef.current = updateSelectedPosition;
    setGpsAccuracyRef.current = setGpsAccuracy;
  }, [updateSelectedPosition, setGpsAccuracy]);

  const clearPending = useCallback(() => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
  }, []);

  useEffect(() => () => clearPending(), [clearPending]);

  const handleGetLocation = useCallback(() => {
    clearPending();
    setGeoError(null);
    setIsLocating(true);
    setGpsAccuracyRef.current(null);

    cleanupRef.current = startGeolocationWatch({
      onSuccess: ({ lat, lng, accuracy }) => {
        setIsLocating(false);
        setGeoError(null);
        setGpsAccuracyRef.current(accuracy);
        updateSelectedPositionRef.current(lat, lng, true, 17);
      },
      onError: (errMsg) => {
        setIsLocating(false);
        setGeoError(errMsg);
      },
    });
  }, [clearPending]);

  return { isLocating, geoError, clearGeoError, handleGetLocation };
};
