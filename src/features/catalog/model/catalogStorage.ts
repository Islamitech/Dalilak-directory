import { Business } from '../../../types';
import { isPublicBusiness } from '../../../shared/publicBusiness';
import { readCatalogCache } from './catalogCache';
import { BIDI_CONTROL_REGEX } from './businessMapper';
import { collectDisplayPhotos } from '../../../utils/categoryPhotos';

export function getInitialCachedBusinesses(): Business[] {
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
            photos: collectDisplayPhotos(b.photos, b.coverPhoto),
          }));
      }
    }
  } catch {}
  return [];
}

export function hasInitialCachedBusinesses(): boolean {
  try {
    const cached = localStorage.getItem('dalelak_directory_cache');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.some((b: any) => isPublicBusiness(b))) {
        return true;
      }
    }
  } catch {}
  return false;
}

export async function hydrateFromIndexedDb(): Promise<Business[]> {
  const cached = await readCatalogCache();
  if (!cached?.length) return [];
  return cached
    .filter((item: any) => isPublicBusiness(item))
    .map(
      (item: any) =>
        ({
          ...item,
          nameAr: typeof item.nameAr === 'string' ? item.nameAr.replace(BIDI_CONTROL_REGEX, '').trim() : item.nameAr,
          nameEn: typeof item.nameEn === 'string' ? item.nameEn.replace(BIDI_CONTROL_REGEX, '').trim() : item.nameEn,
          photos: collectDisplayPhotos(item.photos, item.coverPhoto),
        } as Business)
    );
}

export function dismissInitialLoadingOverlay(): () => void {
  if (typeof document === 'undefined') return () => {};
  const overlay = document.getElementById('initial-loading-overlay');
  if (!overlay) return () => {};
  const timer = window.setTimeout(() => {
    overlay.classList.add('is-hidden');
    window.setTimeout(() => overlay.remove(), 450);
  }, 100);
  return () => window.clearTimeout(timer);
}
