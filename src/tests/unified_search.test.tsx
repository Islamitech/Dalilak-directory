import { describe, expect, it, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { normalizeArabicText, matchesArabicSearch } from '../shared/lib';
import {
  getRecentSearches,
  saveRecentSearchTerm,
  clearRecentSearchesList,
} from '../features/search/model/recentSearches';
import { SearchField } from '../shared/ui';

describe('Item 5 - Unified Search: Normalization, Recent Searches & SearchField', () => {
  beforeEach(() => {
    const store: Record<string, string> = {};
    (globalThis as any).localStorage = {
      getItem: (k: string) => store[k] || null,
      setItem: (k: string, v: string) => { store[k] = v; },
      removeItem: (k: string) => { delete store[k]; },
      clear: () => { for (const k in store) delete store[k]; },
    };
  });

  it('normalizes Arabic characters, alefs, teh marbuta, and digits', () => {
    expect(normalizeArabicText('أحمد')).toBe('احمد');
    expect(normalizeArabicText('إسلام')).toBe('اسلام');
    expect(normalizeArabicText('صيدلية')).toBe('صيدليه');
    expect(normalizeArabicText('مستشفى')).toBe('مستشفي');
    expect(normalizeArabicText('١٢٣')).toBe('123');
    expect(normalizeArabicText('  طبيب   أسنان  ')).toBe('طبيب اسنان');
  });

  it('matches Arabic search queries regardless of alef or teh marbuta variations', () => {
    expect(matchesArabicSearch('صيدلية الشفاء', 'صيدليه')).toBe(true);
    expect(matchesArabicSearch('مطعم أبو علي', 'ابو')).toBe(true);
    expect(matchesArabicSearch('كافيه الأندلس', 'الاندلس')).toBe(true);
    expect(matchesArabicSearch('عمارة ١٢٣', '123')).toBe(true);
  });

  it('manages recent search terms: save, limit, dedupe, and clear', () => {
    let list = saveRecentSearchTerm('صيدلية', []);
    expect(list).toEqual(['صيدلية']);

    list = saveRecentSearchTerm('مطعم', list);
    expect(list).toEqual(['مطعم', 'صيدلية']);

    // Dedupe
    list = saveRecentSearchTerm('صيدلية', list);
    expect(list).toEqual(['صيدلية', 'مطعم']);

    clearRecentSearchesList();
    expect(getRecentSearches()).toEqual([]);
  });

  it('SearchField renders semantic searchbox with clear button when value is present', () => {
    const htmlWithVal = renderToStaticMarkup(
      <SearchField value="طبيب" onChange={() => {}} placeholder="ابحث..." />
    );
    expect(htmlWithVal).toContain('role="searchbox"');
    expect(htmlWithVal).toContain('type="search"');
    expect(htmlWithVal).toContain('value="طبيب"');
    expect(htmlWithVal).toContain('aria-label="مسح نص البحث"');

    const htmlEmpty = renderToStaticMarkup(
      <SearchField value="" onChange={() => {}} placeholder="ابحث..." />
    );
    expect(htmlEmpty).not.toContain('aria-label="مسح نص البحث"');
  });
});
