import { normalizeArabicText } from '../shared/lib/arabicSearch';
import { resolveCategorySelection } from './categoryMatcher';
const HADAYEK_DISTRICT_LETTERS = ['أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح', 'ط', 'ك', 'ل', 'م', 'ن', 'س', 'ص', 'ع'];

/** Only complete category phrases are interpreted; business names remain text searches. */
export function parseActivitySearchIntent(query: string) {
  const text = normalizeArabicText(query);
  if (!text) return null;
  let categoryText = text;
  let zone = 'all';
  const suffix = text.match(/^(.+?)\s+(?:(?:في|ب)\s+)?(?:منطقه\s+)?([اأبجدهوزحطكلمنسصع])$/);
  if (suffix) {
    const districtLetter = HADAYEK_DISTRICT_LETTERS.find((letter) => normalizeArabicText(letter) === suffix[2]);
    if (!districtLetter) return null;
    categoryText = suffix[1];
    zone = districtLetter;
  }
  const selection = resolveCategorySelection(categoryText);
  if (selection.mainCategoryId === 'all') return null;
  return { ...selection, category: selection.subcategoryId !== 'all' ? selection.subcategoryId : selection.mainCategoryId, zone };
}
