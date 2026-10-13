import { useState, useCallback, useRef, useEffect } from 'react';

export interface ShowcaseToastAction {
  label: string;
  onAction: () => void;
}

export function useShowcaseToast() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastAction, setToastAction] = useState<ShowcaseToastAction | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef<boolean>(true);

  const hideToast = useCallback(() => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    if (isMountedRef.current) {
      setToastMessage(null);
      setToastAction(null);
    }
  }, []);

  const showToast = useCallback(
    (msg: string, undo?: () => void) => {
      if (!isMountedRef.current) return;
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
        toastTimerRef.current = null;
      }
      setToastMessage(msg);
      setToastAction(
        undo
          ? {
              label: 'تراجع',
              onAction: () => {
                try {
                  undo();
                } finally {
                  hideToast();
                }
              },
            }
          : null
      );
      toastTimerRef.current = setTimeout(hideToast, undo ? 5000 : 3500);
    },
    [hideToast]
  );

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
        toastTimerRef.current = null;
      }
    };
  }, []);

  return {
    toastMessage,
    toastAction,
    showToast,
    hideToast,
  };
}
