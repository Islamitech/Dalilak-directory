import { useState, useEffect } from 'react';
import { Business } from '../../../types';
import { isPublicBusiness } from '../../../shared/publicBusiness';
import { supabase, SUPABASE_ANON_KEY } from '../../../services/supabaseClient';
import { mergeCatalog, catalogsEqual } from '../../../services/catalogState';
import { readCatalogCache, writeCatalogCache } from '../../../services/catalogCache';
import {
  BIDI_CONTROL_REGEX,
  SUPABASE_REST_URL,
  getSafeCacheList,
  mapRawToBusiness,
} from '../model/businessMapper';

export interface UseCatalogLifecycleResult {
  businesses: Business[];
  loading: boolean;
  directoryLoad: { pending: boolean; error: string };
  syncToastMessage: string | null;
}

export function useCatalogLifecycle(): UseCatalogLifecycleResult {
  const [businesses, setBusinesses] = useState<Business[]>(() => {
    try {
      const cached = localStorage.getItem('dalelak_directory_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
            .filter((b: any) => isPublicBusiness(b))
            .map((b: any) => ({
              ...b,
              nameAr: typeof b.nameAr === 'string' ? b.nameAr.replace(BIDI_CONTROL_REGEX, '').trim() : b.nameAr,
              nameEn: typeof b.nameEn === 'string' ? b.nameEn.replace(BIDI_CONTROL_REGEX, '').trim() : b.nameEn,
              photos: Array.isArray(b.photos) && b.photos.length > 0 ? b.photos : (b.coverPhoto ? [b.coverPhoto] : []),
            }));
        }
      }
    } catch {}
    return [];
  });

  const [catalogCacheReady, setCatalogCacheReady] = useState(false);
  const [loading, setLoading] = useState<boolean>(() => {
    try {
      const cached = localStorage.getItem('dalelak_directory_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.some((b: any) => isPublicBusiness(b))) {
          return false;
        }
      }
    } catch {}
    return true;
  });

  const [directoryLoad, setDirectoryLoad] = useState<{ pending: boolean; error: string }>(() => {
    try {
      const cached = localStorage.getItem('dalelak_directory_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.some((b: any) => isPublicBusiness(b))) {
          return { pending: false, error: '' };
        }
      }
    } catch {}
    return { pending: true, error: '' };
  });

  const [syncToastMessage, setSyncToastMessage] = useState<string | null>(null);

  function triggerSyncToast(msg: string) {
    setSyncToastMessage(msg);
    setTimeout(() => {
      setSyncToastMessage((current) => (current === msg ? null : current));
    }, 4000);
  }

  // Fade out splash overlay once mounted
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const overlay = document.getElementById('initial-loading-overlay');
    if (!overlay) return;
    const timer = window.setTimeout(() => {
      overlay.classList.add('is-hidden');
      window.setTimeout(() => overlay.remove(), 450);
    }, 100);
    return () => window.clearTimeout(timer);
  }, []);

  // Hydrate from IndexedDB cache
  useEffect(() => {
    let active = true;
    void readCatalogCache()
      .then((cached) => {
        if (!active || !cached?.length) return;
        const publicCatalog = cached
          .filter((item: any) => isPublicBusiness(item))
          .map(
            (item: any) =>
              ({
                ...item,
                nameAr:
                  typeof item.nameAr === 'string'
                    ? item.nameAr.replace(BIDI_CONTROL_REGEX, '').trim()
                    : item.nameAr,
                nameEn:
                  typeof item.nameEn === 'string'
                    ? item.nameEn.replace(BIDI_CONTROL_REGEX, '').trim()
                    : item.nameEn,
                photos:
                  Array.isArray(item.photos) && item.photos.length
                    ? item.photos
                    : item.coverPhoto
                    ? [item.coverPhoto]
                    : [],
              } as Business)
          );
        if (publicCatalog.length) {
          setBusinesses((current) => (current.length ? current : publicCatalog));
          setLoading(false);
          setDirectoryLoad((current) => (current.pending ? { pending: false, error: '' } : current));
        }
      })
      .finally(() => {
        if (active) setCatalogCacheReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  // Primary data fetch, realtime subscription, and visibility refresh
  useEffect(() => {
    let mounted = true;
    let controller: AbortController | null = null;
    let overrides = new Map<string, Business | null>();

    const commit = (snapshot: Business[], partial = false) => {
      if (!mounted) return;
      const live = new Map(overrides);
      setBusinesses((prev) => {
        const base = partial
          ? [...new Map([...prev, ...snapshot].map((b) => [b.id, b])).values()]
          : snapshot;
        const next = mergeCatalog(base, live);
        return catalogsEqual(prev, next) ? prev : next;
      });
    };

    async function loadBusinesses() {
      controller?.abort();
      const request = new AbortController();
      controller = request;
      overrides = new Map();
      setDirectoryLoad({ pending: true, error: '' });
      const timeout = window.setTimeout(() => request.abort(), 60000);

      try {
        let offset = 0;
        const accumulated: Business[] = [];
        while (true) {
          const size = offset === 0 ? 60 : 500;
          const response = await fetch(SUPABASE_REST_URL, {
            signal: request.signal,
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
              Range: `${offset}-${offset + size - 1}`,
              'Range-Unit': 'items',
              Prefer: 'count=exact',
            },
          });
          if (!response.ok) throw new Error(`Directory HTTP ${response.status}`);
          const raw = await response.json();
          if (!Array.isArray(raw)) throw new Error('Invalid catalog');
          if (!mounted || request.signal.aborted || controller !== request) return;

          const total = Number(response.headers.get('content-range')?.split('/')[1] || NaN);
          accumulated.push(
            ...raw
              .filter(isPublicBusiness)
              .map(mapRawToBusiness)
              .filter(isPublicBusiness)
          );
          offset += raw.length;
          setLoading(false);

          const complete = !raw.length || (Number.isFinite(total) ? offset >= total : raw.length < size);
          if (complete) {
            commit(accumulated);
            setDirectoryLoad({ pending: false, error: '' });
            break;
          }
          commit(accumulated, true);
          if (offset >= 100000) throw new Error('Catalog limit exceeded');
          await new Promise((resolve) => window.setTimeout(resolve, 0));
        }
      } catch {
        if (mounted && controller === request) {
          setDirectoryLoad({
            pending: false,
            error: 'تعذّر تحديث الأنشطة. البيانات المتاحة قد تكون غير مكتملة.',
          });
        }
      } finally {
        clearTimeout(timeout);
        if (mounted && controller === request) setLoading(false);
      }
    }

    let lastFetchTime = 0;
    const retry = (force = false) => {
      if (!force && Date.now() - lastFetchTime < 300000) return;
      lastFetchTime = Date.now();
      void loadBusinesses();
    };

    const visibility = () => {
      if (!document.hidden && Date.now() - lastFetchTime >= 300000) {
        retry(true);
      }
    };

    const channel = supabase
      .channel('dalelak-public-directory-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'businesses' },
        (payload: any) => {
          if (!mounted) return;
          const id = payload.eventType === 'DELETE' ? payload.old?.id : payload.new?.id;
          if (!id) return;
          const row =
            payload.eventType === 'DELETE' || !isPublicBusiness(payload.new)
              ? null
              : mapRawToBusiness(payload.new);
          const value = row && isPublicBusiness(row) ? row : null;
          overrides.set(id, value);
          setBusinesses((prev) => mergeCatalog(prev, new Map([[id, value]])));
          if (value) triggerSyncToast('تم تحديث بيانات الدليل');
        }
      )
      .subscribe();

    const sync =
      typeof BroadcastChannel !== 'undefined'
        ? new BroadcastChannel('dalelak_data_sync_channel')
        : null;
    if (sync) {
      sync.onmessage = (event) => {
        if (event.data?.type === 'SYNC_DATA') retry(true);
      };
    }

    window.addEventListener('directory:retry', () => retry(true));
    document.addEventListener('visibilitychange', visibility);
    const interval = window.setInterval(() => {
      if (!document.hidden) retry(true);
    }, 300000);

    retry(true);

    return () => {
      mounted = false;
      controller?.abort();
      clearInterval(interval);
      window.removeEventListener('directory:retry', () => retry(true));
      document.removeEventListener('visibilitychange', visibility);
      void supabase.removeChannel(channel);
      sync?.close();
    };
  }, []);

  // Write catalog cache on changes
  useEffect(() => {
    if (catalogCacheReady) void writeCatalogCache(getSafeCacheList(businesses));
  }, [businesses, catalogCacheReady]);

  return { businesses, loading, directoryLoad, syncToastMessage };
}
