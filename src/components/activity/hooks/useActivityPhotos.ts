import { useState, useEffect, useMemo } from 'react';
import { Business } from '../../../types';
import { SUPABASE_REST_BASE, SUPABASE_ANON_KEY } from '../../../shared/lib/supabase';
import { collectDisplayPhotos } from '../../../utils/categoryPhotos';

export function useActivityPhotos(business: Business | null): string[] {
  const [livePhotos, setLivePhotos] = useState<string[]>(() => {
    return business && Array.isArray(business.photos) ? business.photos : [];
  });

  useEffect(() => {
    if (!business?.id) {
      setLivePhotos([]);
      return;
    }
    setLivePhotos(Array.isArray(business.photos) ? business.photos : []);

    let isMounted = true;
    const controller = new AbortController();
    async function fetchPhotosForBiz() {
      try {
        const res = await fetch(
          `${SUPABASE_REST_BASE}/businesses?id=eq.${encodeURIComponent(business!.id)}&select=id,photos,cover_photo`,
          {
            signal: controller.signal,
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            },
          }
        );
        if (res.ok) {
          const rows = await res.json();
          if (Array.isArray(rows) && rows.length > 0 && isMounted) {
            const row = rows[0];
            let fetchedPhotos: string[] = [];
            if (Array.isArray(row.photos)) {
              fetchedPhotos = row.photos.filter((p: unknown) => typeof p === 'string' && p.trim().length > 0);
            } else if (typeof row.photos === 'string' && row.photos.trim().length > 0) {
              try {
                const parsed = JSON.parse(row.photos.trim());
                if (Array.isArray(parsed)) {
                  fetchedPhotos = parsed.filter((p: unknown) => typeof p === 'string' && p.trim().length > 0);
                } else if (typeof parsed === 'string') {
                  fetchedPhotos = [parsed.trim()];
                }
              } catch {
                if (row.photos.startsWith('http') || row.photos.startsWith('data:') || row.photos.startsWith('/')) {
                  fetchedPhotos = [row.photos.trim()];
                }
              }
            }
            if (typeof row.cover_photo === 'string') fetchedPhotos.unshift(row.cover_photo);
            if (isMounted) {
              setLivePhotos(fetchedPhotos);
            }
          }
        }
      } catch {}
    }
    fetchPhotosForBiz();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [business?.id]);

  return useMemo(() => {
    if (!business) return [];
    const fromDatabase = collectDisplayPhotos(livePhotos, business.coverPhoto);
    if (fromDatabase.length > 0) return fromDatabase;
    return collectDisplayPhotos(business.photos, business.coverPhoto);
  }, [business, livePhotos]);
}
