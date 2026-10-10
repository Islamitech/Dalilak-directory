import { Business } from '../../../types';
import { isPublicBusiness } from '../../../shared/publicBusiness';
import { SUPABASE_ANON_KEY, SUPABASE_REST_BASE } from '../../../shared/lib/supabase';
import { LIST_BUSINESS_SELECT, catalogQuery } from '../../../shared/catalogQuery';
import { FAST_BUSINESS_SELECT, mapRawToBusiness } from './businessMapper';

const FIRST_PAGE = 60;
const NEXT_PAGE = 500;

export interface PagedCatalogCallbacks {
  onBatch: (batch: Business[], isComplete: boolean) => void;
  onError: (errorMsg: string) => void;
  onFirstBatchDone: () => void;
}

interface ListHint {
  rows: unknown[];
  total?: number;
}

declare global {
  interface Window {
    __dalilakListPage?: Promise<ListHint>;
  }
}

function catalogUrl(select: string): string {
  return `${SUPABASE_REST_BASE}/${catalogQuery(select)}`;
}

async function readPage(response: Response): Promise<{ rows: any[]; total: number }> {
  if (!response.ok) throw new Error(`Directory HTTP ${response.status}`);
  const rows = await response.json();
  if (!Array.isArray(rows)) throw new Error('Invalid catalog');
  return { rows, total: Number(response.headers.get('content-range')?.split('/')[1] || NaN) };
}

async function fetchPage(select: string, offset: number, size: number, signal: AbortSignal) {
  const response = await fetch(catalogUrl(select), {
    signal,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Range: `${offset}-${offset + size - 1}`,
      'Range-Unit': 'items',
      Prefer: 'count=exact',
    },
  });
  return readPage(response);
}

function toBusinesses(rows: any[]): Business[] {
  return rows.filter(isPublicBusiness).map(mapRawToBusiness).filter(isPublicBusiness);
}

function waitForFirstCardImage(signal: AbortSignal): Promise<void> {
  if (typeof document === 'undefined') return Promise.resolve();
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      observer.disconnect();
      clearTimeout(timer);
      signal.removeEventListener('abort', finish);
      resolve();
    };
    const watch = () => {
      const img = document.querySelector<HTMLImageElement>('.dl-photo img');
      if (!img) return;
      if (img.complete) finish();
      else {
        img.addEventListener('load', finish, { once: true });
        img.addEventListener('error', finish, { once: true });
      }
    };
    const observer = new MutationObserver(watch);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    const timer = setTimeout(finish, 8000);
    signal.addEventListener('abort', finish);
    watch();
  });
}

async function takeListHint(): Promise<ListHint | null> {
  if (typeof window === 'undefined' || !window.__dalilakListPage) return null;
  const hinted = window.__dalilakListPage;
  delete window.__dalilakListPage;
  try {
    const hint = await hinted;
    if (!hint || !Array.isArray(hint.rows) || hint.rows.length === 0) return null;
    return hint;
  } catch {
    return null;
  }
}

export async function fetchAllBusinesses(
  signal: AbortSignal,
  callbacks: PagedCatalogCallbacks
): Promise<void> {
  const accumulated: Business[] = [];
  const hinted = await takeListHint();
  const first = hinted
    ? { rows: hinted.rows as any[], total: Number(hinted.total) }
    : await fetchPage(LIST_BUSINESS_SELECT, 0, FIRST_PAGE, signal);
  if (signal.aborted) return;

  accumulated.push(...toBusinesses(first.rows));
  let offset = first.rows.length;
  let total = first.total;
  callbacks.onFirstBatchDone();

  const firstComplete = !first.rows.length || (Number.isFinite(total) ? offset >= total : first.rows.length < FIRST_PAGE);
  callbacks.onBatch(accumulated, firstComplete);
  if (firstComplete) return;

  await waitForFirstCardImage(signal);
  if (signal.aborted) return;

  try {
    const described = await fetchPage('id,description', 0, FIRST_PAGE, signal);
    const byId = new Map(
      described.rows.map((row) => [String(row.id), typeof row.description === 'string' ? row.description : ''])
    );
    for (let i = 0; i < accumulated.length; i += 1) {
      const description = byId.get(accumulated[i].id);
      if (description && description !== accumulated[i].description) {
        accumulated[i] = { ...accumulated[i], description };
      }
    }
    callbacks.onBatch(accumulated, false);
  } catch {
    // The next full sync can fill descriptions if this page fails.
  }
  if (signal.aborted) return;

  while (true) {
    const page = await fetchPage(FAST_BUSINESS_SELECT, offset, NEXT_PAGE, signal);
    if (signal.aborted) return;
    if (Number.isFinite(page.total)) total = page.total;
    accumulated.push(...toBusinesses(page.rows));
    offset += page.rows.length;
    const complete = !page.rows.length || (Number.isFinite(total) ? offset >= total : page.rows.length < NEXT_PAGE);
    callbacks.onBatch(accumulated.slice(), complete);
    if (complete) break;
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
