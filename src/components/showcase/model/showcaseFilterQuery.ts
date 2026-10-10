const SORTS = ['default', 'nearest', 'newest', 'has_video', 'open_now', 'alpha'] as const;
export type ShowcaseSort = (typeof SORTS)[number];

function params(): URLSearchParams | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search);
}

export function queryFlag(name: string): boolean {
  return params()?.get(name) === '1';
}

export function queryValue(name: string): string | null {
  return params()?.get(name) ?? null;
}

export function hydrateCategoryQuery(
  resolve: (id: string) => { mainCategoryId: string; subcategoryId: string }
): { main: string | null; sub: string | null; q: string | null } {
  const categoryParam = queryValue('cat');
  const subcategoryParam = queryValue('subcat');
  if (!categoryParam) return { main: null, sub: null, q: queryValue('q') || queryValue('search') };
  const selection = resolve(categoryParam);
  let sub = selection.subcategoryId;
  if (subcategoryParam) {
    const subSelection = resolve(subcategoryParam);
    sub = subSelection.mainCategoryId === selection.mainCategoryId ? subSelection.subcategoryId : selection.subcategoryId;
  }
  return { main: selection.mainCategoryId, sub, q: queryValue('q') || queryValue('search') };
}

export function hasShowcaseFilters(input: {
  searchQuery: string;
  govFilter: string;
  cityFilter: string;
  hadayekZoneFilter: string;
  categoryFilter: string;
  subcategoryFilter: string;
  openNowOnly: boolean;
  verifiedOnly: boolean;
  hideActivities: boolean;
  hasRatingOnly: boolean;
  hasVideoOnly: boolean;
  sortBy: string;
}): boolean {
  return (
    input.searchQuery !== '' ||
    (input.govFilter !== 'الجيزة' && input.govFilter !== 'all') ||
    (input.cityFilter !== 'حدائق الأهرام' && input.cityFilter !== 'all') ||
    input.hadayekZoneFilter !== 'all' ||
    input.categoryFilter !== 'all' ||
    input.subcategoryFilter !== 'all' ||
    input.openNowOnly ||
    input.verifiedOnly ||
    input.hideActivities ||
    input.hasRatingOnly ||
    input.hasVideoOnly ||
    input.sortBy !== 'default'
  );
}

export function querySort(): ShowcaseSort {
  const value = queryValue('sort');
  return (SORTS as readonly string[]).includes(value || '') ? (value as ShowcaseSort) : 'default';
}

export function writeShowcaseQuery(state: {
  categoryFilter: string;
  subcategoryFilter: string;
  hadayekZoneFilter: string;
  openNowOnly: boolean;
  verifiedOnly: boolean;
  hideActivities: boolean;
  sortBy: string;
  searchQuery?: string;
}): void {
  if (typeof window === 'undefined') return;
  const path = window.location.pathname;
  if (path !== '/map' && path !== '/' && path !== '/search') return;
  const url = new URL(window.location.href);
  const bit = (key: string, active: boolean) => (active ? url.searchParams.set(key, '1') : url.searchParams.delete(key));
  if (state.categoryFilter === 'all') url.searchParams.delete('cat');
  else url.searchParams.set('cat', state.categoryFilter);
  if (state.subcategoryFilter === 'all') url.searchParams.delete('subcat');
  else url.searchParams.set('subcat', state.subcategoryFilter);
  const buildingLocked = url.searchParams.has('bldg');
  if (!buildingLocked) {
    if (!state.hadayekZoneFilter || state.hadayekZoneFilter === 'all') url.searchParams.delete('zone');
    else url.searchParams.set('zone', state.hadayekZoneFilter);
  } else if (state.hadayekZoneFilter && state.hadayekZoneFilter !== 'all') {
    url.searchParams.set('zone', state.hadayekZoneFilter);
  }
  bit('open', state.openNowOnly);
  bit('verified', state.verifiedOnly);
  bit('hide', state.hideActivities);
  if (state.sortBy === 'default') url.searchParams.delete('sort');
  else url.searchParams.set('sort', state.sortBy);
  const query = (state.searchQuery || '').trim();
  if (query) url.searchParams.set('q', query);
  else url.searchParams.delete('q');
  url.searchParams.delete('search');
  const next = `${url.pathname}${url.search}`;
  const current = `${window.location.pathname}${window.location.search}`;
  if (next !== current) window.history.replaceState(window.history.state, '', next);
}
