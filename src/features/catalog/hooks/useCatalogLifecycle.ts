import { useState, useEffect } from 'react';
import { Business } from '../../../types';
import { mergeCatalog, catalogsEqual } from '../model/catalogState';
import { writeCatalogCache } from '../model/catalogCache';
import { getSafeCacheList } from '../model/businessMapper';
import {
  getInitialCachedBusinesses,
  hasInitialCachedBusinesses,
  hydrateFromIndexedDb,
  dismissInitialLoadingOverlay,
} from '../model/catalogStorage';
import { runCatalogSync } from '../model/catalogFetcher';
import { setupCatalogSubscriptions, setupCatalogAutoSync } from '../model/catalogSubscriptions';

export interface UseCatalogLifecycleResult {
  businesses: Business[];
  loading: boolean;
  directoryLoad: { pending: boolean; error: string };
  syncToastMessage: string | null;
}

export function useCatalogLifecycle(): UseCatalogLifecycleResult {
  const [businesses, setBusinesses] = useState<Business[]>(getInitialCachedBusinesses);
  const [catalogCacheReady, setCatalogCacheReady] = useState(false);
  const [loading, setLoading] = useState<boolean>(() => !hasInitialCachedBusinesses());
  const [directoryLoad, setDirectoryLoad] = useState<{ pending: boolean; error: string }>(() => ({
    pending: !hasInitialCachedBusinesses(),
    error: '',
  }));
  const [syncToastMessage, setSyncToastMessage] = useState<string | null>(null);

  const triggerSyncToast = (msg: string) => {
    setSyncToastMessage(msg);
    setTimeout(() => setSyncToastMessage((curr) => (curr === msg ? null : curr)), 4000);
  };

  useEffect(() => dismissInitialLoadingOverlay(), []);

  useEffect(() => {
    let active = true;
    hydrateFromIndexedDb().then((publicCatalog) => {
      if (!active || !publicCatalog.length) return;
      setBusinesses((current) => (current.length ? current : publicCatalog));
      setLoading(false);
      setDirectoryLoad((curr) => (curr.pending ? { pending: false, error: '' } : curr));
    }).finally(() => { if (active) setCatalogCacheReady(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    let controller: AbortController | null = null;
    let overrides = new Map<string, Business | null>();

    const commit = (snapshot: Business[], partial = false) => {
      if (!mounted) return;
      setBusinesses((prev) => {
        const base = partial ? [...new Map([...prev, ...snapshot].map((b) => [b.id, b])).values()] : snapshot;
        const next = mergeCatalog(base, overrides);
        return catalogsEqual(prev, next) ? prev : next;
      });
    };

    const loadBusinesses = async () => {
      controller?.abort();
      const request = new AbortController();
      controller = request;
      overrides = new Map();
      setDirectoryLoad({ pending: true, error: '' });
      try {
        await runCatalogSync({
          signal: request.signal,
          onSnapshot: (snap, partial) => {
            if (!mounted || request.signal.aborted || controller !== request) return;
            commit(snap, partial);
            if (!partial) setDirectoryLoad({ pending: false, error: '' });
          },
          onFirstBatchDone: () => { if (mounted) setLoading(false); },
        });
      } catch {
        if (mounted && controller === request) {
          setDirectoryLoad({ pending: false, error: 'تعذّر تحديث الأنشطة. البيانات المتاحة قد تكون غير مكتملة.' });
        }
      } finally {
        if (mounted && controller === request) setLoading(false);
      }
    };

    const cleanupSubs = setupCatalogSubscriptions({
      onRealtimePayload: (id, val) => {
        if (!mounted) return;
        overrides.set(id, val);
        setBusinesses((prev) => mergeCatalog(prev, new Map([[id, val]])));
        if (val) triggerSyncToast('تم تحديث بيانات الدليل');
      },
      onRetryRequested: () => void loadBusinesses(),
    });

    const cleanupAutoSync = setupCatalogAutoSync(() => void loadBusinesses());
    void loadBusinesses();

    return () => {
      mounted = false;
      controller?.abort();
      cleanupAutoSync();
      cleanupSubs();
    };
  }, []);

  useEffect(() => {
    if (catalogCacheReady) void writeCatalogCache(getSafeCacheList(businesses));
  }, [businesses, catalogCacheReady]);

  return { businesses, loading, directoryLoad, syncToastMessage };
}
