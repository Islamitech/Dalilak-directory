import { normalizeArabicText } from './arabicSearch';
import { resolveCategorySelection } from './categoryMatcher';
import { HADAYEK_OFFICIAL_DISTRICTS } from '../data/hadayekDistrictsGeoData';

/** Only complete category phrases are interpreted; business names remain text searches. */
export function parseActivitySearchIntent(query: string) {
  const text = normalizeArabicText(query);
  if (!text) return null;
  let categoryText = text;
  let zone = 'all';
  const suffix = text.match(/^(.+?)\s+(?:(?:في|ب)\s+)?(?:منطقه\s+)?([اأبجدهوزحطكلمنسصع])$/);
  if (suffix) {
    const district = HADAYEK_OFFICIAL_DISTRICTS.find(d => normalizeArabicText(d.letterAr) === suffix[2]);
    if (!district) return null;
    categoryText = suffix[1]; zone = district.letterAr;
  }
  const selection = resolveCategorySelection(categoryText);
  if (selection.mainCategoryId === 'all') return null;
  return { ...selection, category: selection.subcategoryId !== 'all' ? selection.subcategoryId : selection.mainCategoryId, zone };
}
