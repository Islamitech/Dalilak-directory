import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Item 7: RTL Logical Utilities, Light-Only Theme, and BDI', () => {
  it('verifies that src/index.css is light-only (no dark variant, no dark tokens)', () => {
    const cssPath = path.resolve(__dirname, '../index.css');
    const css = fs.readFileSync(cssPath, 'utf8');

    expect(css).not.toContain('@custom-variant dark');
    expect(css).not.toContain('[data-theme="dark"]');
    expect(css).toContain('--bg-primary');
    expect(css).toContain('--bg-card');
    expect(css).toContain('--text-primary');
    expect(css).toContain('--border-color');
  });

  it('verifies that zero physical direction classes (ml-, mr-, pl-, pr-, text-right, text-left) exist in UI components', () => {
    function walk(dir: string): string[] {
      let files: string[] = [];
      for (const item of fs.readdirSync(dir)) {
        const full = path.join(dir, item);
        if (fs.statSync(full).isDirectory()) files.push(...walk(full));
        else files.push(full);
      }
      return files;
    }

    const allFiles = walk(path.resolve(__dirname, '../components')).concat(
      walk(path.resolve(__dirname, '../features'))
    );

    const physicalRegex = /\b(ml-\d+|mr-\d+|pl-\d+|pr-\d+|text-left\b|text-right\b)\b/g;
    const violations: { file: string; match: string }[] = [];

    for (const f of allFiles) {
      if (!f.endsWith('.tsx') && !f.endsWith('.ts')) continue;
      if (f.includes('test') || f.includes('playwright')) continue;
      const content = fs.readFileSync(f, 'utf8');
      const matches = content.match(physicalRegex);
      if (matches) {
        violations.push({ file: path.relative(process.cwd(), f), match: matches.join(', ') });
      }
    }

    expect(violations).toEqual([]);
  });

  it('verifies that UnifiedBusinessCard variants wrap names in bdi dir=auto', () => {
    const gridFile = fs.readFileSync(
      path.resolve(__dirname, '../features/business-details/components/BusinessCardGridVariant.tsx'),
      'utf8'
    );
    expect(gridFile).toContain('<bdi dir="auto">{business.nameAr}</bdi>');

    const compactFile = fs.readFileSync(
      path.resolve(__dirname, '../features/business-details/components/BusinessCardCompactVariant.tsx'),
      'utf8'
    );
    expect(compactFile).toContain('<bdi dir="auto">{business.nameAr}</bdi>');
  });
});
