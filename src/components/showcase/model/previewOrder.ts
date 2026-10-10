import { Business } from '../../../types';
import { classifyBusinessCategory } from '../../../utils/categoryMatcher';
import { collectRealPhotos } from '../../../utils/categoryPhotos';
import { shuffleBusinessesWithSeed } from '../../../utils/directoryEnhancements';

function hasRealPhoto(business: Business): boolean {
  return collectRealPhotos(business.photos, business.coverPhoto).length > 0;
}

/** Session-stable mix: categories take turns, and photo cards alternate with icon cards. */
export function spreadDirectoryPreview(list: Business[], seed: number): Business[] {
  const shuffled = shuffleBusinessesWithSeed(list, seed);
  const groups = new Map<string, Business[]>();
  for (const business of shuffled) {
    const key = classifyBusinessCategory(business).mainCategoryId || 'other';
    const group = groups.get(key);
    if (group) group.push(business);
    else groups.set(key, [business]);
  }

  const keys = shuffleBusinessesWithSeed(
    [...groups.keys()].map((key) => ({ id: key }) as Business),
    seed + 17
  ).map((item) => item.id);
  const queues = keys.map((key) => groups.get(key)!);
  const result: Business[] = [];
  let cursor = 0;
  let lastPhoto: boolean | null = null;

  while (result.length < shuffled.length) {
    let contrastPick = -1;
    let anyPick = -1;
    for (let step = 0; step < queues.length; step += 1) {
      const index = (cursor + step) % queues.length;
      const next = queues[index][0];
      if (!next) continue;
      if (anyPick < 0) anyPick = index;
      if (lastPhoto === null || hasRealPhoto(next) !== lastPhoto) {
        contrastPick = index;
        break;
      }
    }
    const picked = contrastPick >= 0 ? contrastPick : anyPick;
    if (picked < 0) break;
    const business = queues[picked].shift()!;
    result.push(business);
    lastPhoto = hasRealPhoto(business);
    cursor = (picked + 1) % queues.length;
  }

  return result;
}

const previewLock = { seed: 0, settled: false, ids: [] as string[] };

function resetPreviewLock(seed: number): void {
  if (previewLock.seed === seed) return;
  previewLock.seed = seed;
  previewLock.settled = false;
  previewLock.ids = [];
}

function placeKnownThenNew(list: Business[], seed: number): Business[] {
  const byId = new Map(list.map((business) => [business.id, business]));
  const known = previewLock.ids.filter((id) => byId.has(id));
  const knownSet = new Set(known);
  const newcomers = spreadDirectoryPreview(
    list.filter((business) => !knownSet.has(business.id)),
    seed + known.length + 1
  );
  const next = [...known.map((id) => byId.get(id)!), ...newcomers];
  previewLock.ids = next.map((business) => business.id);
  return next;
}

/**
 * Unfiltered preview order.
 * While the catalog is still arriving, the first rows stay put and new rows append.
 * When the catalog has settled, one mix of the whole directory is locked for the session.
 */
export function orderUnfilteredPreview(list: Business[], seed: number, catalogSettled: boolean): Business[] {
  resetPreviewLock(seed);
  if (previewLock.settled) return placeKnownThenNew(list, seed);

  if (!catalogSettled) {
    if (previewLock.ids.length === 0) {
      const first = spreadDirectoryPreview(list, seed);
      previewLock.ids = first.map((business) => business.id);
      return first;
    }
    return placeKnownThenNew(list, seed);
  }

  const full = spreadDirectoryPreview(list, seed);
  previewLock.settled = true;
  previewLock.ids = full.map((business) => business.id);
  return full;
}
