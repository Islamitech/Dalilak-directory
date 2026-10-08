import { describe, expect, it } from 'vitest';
import { parseHadayekBuildingAddress, normalizeHadayekZoneLetter, searchInsideHadayekZone } from '../utils/hadayekBuildingSearch';
import { searchBuildingCoordinatesExact } from '../data/hadayekAtlasData';

describe('Hadayek Building Number Search Contract (A2)', () => {
  describe('Input Table -> Expected Parse Results', () => {
    const testCases: Array<{
      input: string;
      currentZone?: string;
      expected: { buildingNumber: string; zoneLetter: string } | null;
      description: string;
    }> = [
      // 1. Mandatory positive test rows from owner contract
      { input: '265 ح', expected: { buildingNumber: '265', zoneLetter: 'ح' }, description: 'mandatory row 1: "265 ح"' },
      { input: 'منطقة ح عمارة 213', expected: { buildingNumber: '213', zoneLetter: 'ح' }, description: 'mandatory row 2: "منطقة ح عمارة 213"' },
      { input: 'منطقة ل مبنى 114', expected: { buildingNumber: '114', zoneLetter: 'ل' }, description: 'mandatory row 3: "منطقة ل مبنى 114"' },
      { input: 'ا 412', expected: { buildingNumber: '412', zoneLetter: 'أ' }, description: 'mandatory row 4: "ا 412" (bare alef maps to أ)' },

      // 2. Order-independent variants of mandatory rows
      { input: 'ح 265', expected: { buildingNumber: '265', zoneLetter: 'ح' }, description: 'inverted "ح 265"' },
      { input: 'عمارة 213 منطقة ح', expected: { buildingNumber: '213', zoneLetter: 'ح' }, description: 'inverted "عمارة 213 منطقة ح"' },
      { input: 'مبنى 114 منطقة ل', expected: { buildingNumber: '114', zoneLetter: 'ل' }, description: 'inverted "مبنى 114 منطقة ل"' },
      { input: '412 ا', expected: { buildingNumber: '412', zoneLetter: 'أ' }, description: 'inverted "412 ا"' },

      // 3. Normalization: Arabic-Indic digits, tatweel, separators, spacing
      { input: '٢٦٥ ح', expected: { buildingNumber: '265', zoneLetter: 'ح' }, description: 'Arabic-Indic digits "٢٦٥ ح"' },
      { input: 'منطقة ح عمارة ٢١٣', expected: { buildingNumber: '213', zoneLetter: 'ح' }, description: 'Arabic-Indic digits in full phrase' },
      { input: '265ح', expected: { buildingNumber: '265', zoneLetter: 'ح' }, description: 'glued digits-letter "265ح"' },
      { input: 'ح265', expected: { buildingNumber: '265', zoneLetter: 'ح' }, description: 'glued letter-digits "ح265"' },
      { input: 'ح-265', expected: { buildingNumber: '265', zoneLetter: 'ح' }, description: 'hyphen separator "ح-265"' },
      { input: '265-ح', expected: { buildingNumber: '265', zoneLetter: 'ح' }, description: 'hyphen separator "265-ح"' },
      { input: '265/ح', expected: { buildingNumber: '265', zoneLetter: 'ح' }, description: 'slash separator "265/ح"' },
      { input: '  265    ح  ', expected: { buildingNumber: '265', zoneLetter: 'ح' }, description: 'extra whitespaces' },
      { input: 'مـنـطـقـة ح عـمـارة 213', expected: { buildingNumber: '213', zoneLetter: 'ح' }, description: 'tatweel elongation in phrase' },
      { input: 'حــــ 265', expected: { buildingNumber: '265', zoneLetter: 'ح' }, description: 'tatweel elongation in zone letter' },
      { input: 'عماره 213 منطقه ح', expected: { buildingNumber: '213', zoneLetter: 'ح' }, description: 'feminine teh-marbuta filler words' },
      { input: 'مبني 114 منطقه ل', expected: { buildingNumber: '114', zoneLetter: 'ل' }, description: 'alef-maqsura filler words' },

      // 4. Zone letter variants
      { input: '265 أ', expected: { buildingNumber: '265', zoneLetter: 'أ' }, description: 'canonical zone أ' },
      { input: '265 ا', expected: { buildingNumber: '265', zoneLetter: 'أ' }, description: 'bare alef variant -> maps to أ' },
      { input: '265 إ', expected: { buildingNumber: '265', zoneLetter: 'أ' }, description: 'kasra alef variant -> maps to أ' },
      { input: '265 آ', expected: { buildingNumber: '265', zoneLetter: 'أ' }, description: 'madda alef variant -> maps to أ' },
      { input: 'أ 412', expected: { buildingNumber: '412', zoneLetter: 'أ' }, description: 'canonical zone أ with 412' },
      { input: '265 هـ', expected: { buildingNumber: '265', zoneLetter: 'هـ' }, description: 'canonical zone هـ' },
      { input: '265 ه', expected: { buildingNumber: '265', zoneLetter: 'هـ' }, description: 'bare heh variant -> maps to هـ' },
      { input: '265 ة', expected: { buildingNumber: '265', zoneLetter: 'هـ' }, description: 'teh marbuta variant -> maps to هـ' },

      // 5. Negative test rows: must NOT hijack normal business/text queries
      { input: 'صيدلية 24', expected: null, description: 'negative row: business with number "صيدلية 24"' },
      { input: 'مطعم ا', expected: null, description: 'negative row: business query "مطعم ا"' },
      { input: '24 ساعة', expected: null, description: 'negative row: duration/hours "24 ساعة"' },
      { input: 'منطقة', expected: null, description: 'negative row: filler word alone "منطقة"' },
      { input: 'مبنى', expected: null, description: 'negative row: filler word alone "مبنى"' },
      { input: 'عمارة', expected: null, description: 'negative row: filler word alone "عمارة"' },
      { input: 'مطعم 55', expected: null, description: 'negative row: business with number "مطعم 55"' },
      { input: 'سوبرماركت 12', expected: null, description: 'negative row: business with number "سوبرماركت 12"' },

      // 6. Plain number alone
      { input: '265', currentZone: undefined, expected: null, description: 'plain number without active zone is ignored' },
      { input: '265', currentZone: 'all', expected: null, description: 'plain number with "all" zone is ignored' },
      { input: '265', currentZone: 'ح', expected: { buildingNumber: '265', zoneLetter: 'ح' }, description: 'plain number with active zone ح resolves' },

      // 7. Invalid zone letters: ignored, letting regular text search proceed
      { input: '265 خ', expected: null, description: 'invalid zone letter خ is ignored' },
      { input: '265 ث', expected: null, description: 'invalid zone letter ث is ignored' },
      { input: '265 غ', expected: null, description: 'invalid zone letter غ is ignored' },

      // 8. Unknown building number in valid zone
      { input: '999 ح', expected: { buildingNumber: '999', zoneLetter: 'ح' }, description: 'unknown building number parsed syntactically' },
    ];

    for (const tc of testCases) {
      it(`parses: ${tc.description} ("${tc.input}")`, () => {
        const result = parseHadayekBuildingAddress(tc.input, tc.currentZone);
        expect(result).toEqual(tc.expected);
      });
    }
  });

  describe('Database Lookups: Known vs Unknown Buildings', () => {
    it('known building 265 ح resolves to exact GPS coordinates', async () => {
      const coords = await searchBuildingCoordinatesExact('ح', '265');
      expect(coords).not.toBeNull();
      expect(coords?.lat).toBeCloseTo(29.969, 1);
      expect(coords?.lng).toBeCloseTo(31.11, 1);
    });

    it('unknown building 999 ح returns null (never a fake centroid)', async () => {
      const coords = await searchBuildingCoordinatesExact('ح', '999');
      expect(coords).toBeNull();
    });

    it('searchInsideHadayekZone omits fake/estimated coordinates for unknown building 999', async () => {
      const results = await searchInsideHadayekZone('ح', '999', []);
      const buildingResults = results.filter((r) => r.type === 'building');
      expect(buildingResults).toHaveLength(0);
    });

    it('searchInsideHadayekZone resolves exact coordinates for known building 265', async () => {
      const results = await searchInsideHadayekZone('ح', '265', []);
      const buildingResults = results.filter((r) => r.type === 'building');
      expect(buildingResults.length).toBeGreaterThan(0);
      expect((buildingResults[0] as any).lat).toBeCloseTo(29.969, 1);
    });
  });

  describe('Zone Letter Normalization', () => {
    it('maps alef variants to canonical أ', () => {
      expect(normalizeHadayekZoneLetter('ا')).toBe('أ');
      expect(normalizeHadayekZoneLetter('أ')).toBe('أ');
      expect(normalizeHadayekZoneLetter('إ')).toBe('أ');
      expect(normalizeHadayekZoneLetter('آ')).toBe('أ');
    });

    it('maps heh variants to canonical هـ', () => {
      expect(normalizeHadayekZoneLetter('ه')).toBe('هـ');
      expect(normalizeHadayekZoneLetter('ة')).toBe('هـ');
      expect(normalizeHadayekZoneLetter('هـ')).toBe('هـ');
    });

    it('rejects letters outside the 16 Hadayek zones', () => {
      expect(normalizeHadayekZoneLetter('خ')).toBeNull();
      expect(normalizeHadayekZoneLetter('ث')).toBeNull();
      expect(normalizeHadayekZoneLetter('ض')).toBeNull();
    });
  });
});
