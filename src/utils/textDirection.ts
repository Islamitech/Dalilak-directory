export type TextDirection = 'rtl' | 'ltr';

const RTL_STRONG = /[\u0590-\u05FF\u0600-\u06FF\u0700-\u074F\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
const LATIN_STRONG = /[A-Za-z]/;

/**
 * Chromium's first-strong algorithm for dir=auto does not descend into a <bdi>
 * child (it is always neutral), so a truncating clipper cannot rely on dir="auto"
 * when the user text is wrapped in <bdi>. Resolve the direction explicitly from
 * the first strong character and set it on the clipper itself; the inner <bdi>
 * stays for the rtl_theme_tokens contract.
 */
export function getFirstStrongDirection(text: string | null | undefined): TextDirection {
  const s = text || '';
  for (const ch of s) {
    if (RTL_STRONG.test(ch)) return 'rtl';
    if (LATIN_STRONG.test(ch)) return 'ltr';
  }
  return 'rtl';
}
