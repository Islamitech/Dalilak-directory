import { Business } from '../../../types';
import { isPublicBusiness } from '../../../shared/publicBusiness';
import { SUPABASE_ANON_KEY } from '../../../services/supabaseClient';
import { SUPABASE_REST_URL, mapRawToBusiness } from './businessMapper';

export interface PagedCatalogCallbacks {
  onBatch: (batch: Business[], isComplete: boolean) => void;
  onError: (errorMsg: string) => void;
  onFirstBatchDone: () => void;
}

export async function fetchAllBusinesses(
  signal: AbortSignal,
  callbacks: PagedCatalogCallbacks
): Promise<void> {
  let offset = 0;
  const accumulated: Business[] = [];

  while (true) {
    const size = offset === 0 ? 60 : 500;
    const response = await fetch(SUPABASE_REST_URL, {
      signal,
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
    if (signal.aborted) return;

    const total = Number(response.headers.get('content-range')?.split('/')[1] || NaN);
    accumulated.push(
      ...raw
        .filter(isPublicBusiness)
        .map(mapRawToBusiness)
        .filter(isPublicBusiness)
    );
    offset += raw.length;
    callbacks.onFirstBatchDone();

    const complete = !raw.length || (Number.isFinite(total) ? offset >= total : raw.length < size);
    if (complete) {
      callbacks.onBatch(accumulated, true);
      break;
    }
    // Emit partial snapshot only for the first batch to achieve sub-second FCP
    if (offset === raw.length) {
      callbacks.onBatch(accumulated, false);
      // Give browser an uninterrupted window to paint LCP, settle DOM, and clear TBT
      await new Promise((resolve) => setTimeout(resolve, 1200));
    } else {
      await new Promise((resolve) => {
        if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
          (window as any).requestIdleCallback(resolve, { timeout: 2000 });
        } else {
          setTimeout(resolve, 100);
        }
      });
    }
  }
}

export interface FetchCatalogOptions {
  signal: AbortSignal;
  onSnapshot: (snapshot: Business[], partial: boolean) => void;
  onFirstBatchDone: () => void;
}

export async function runCatalogSync(options: FetchCatalogOptions): Promise<void> {
  await fetchAllBusinesses(options.signal, {
    onBatch: (accumulated, isComplete) => options.onSnapshot(accumulated, !isComplete),
    onError: () => {},
    onFirstBatchDone: options.onFirstBatchDone,
  });
}
