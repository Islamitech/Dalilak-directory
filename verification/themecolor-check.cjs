/* theme-color unification check (verification only — no source changes).
   Asserts that after build:
   - dist/index.html meta theme-color equals the design brand gold #c59b27
     (same value as src/index.css --color-brand-gold token; no runtime mutation in src)
   - dist/manifest.json theme_color equals the same brand gold (single source of truth)
   - dist/manifest.json background_color matches the light fast-paint shell (#f8fafc)
     instead of the leftover near-black from the removed dark theme
   - dist/offline.html keeps its intentional dark theme-color (#0a0a12) — standalone
     offline page whose design is dark by choice, unrelated to the app shell. */
const fs = require('fs');
const path = require('path');

const ROOT = 'C:/Users/karee/OneDrive/Desktop/Dalilak-directory-AUDIT';
const DIST = path.join(ROOT, 'dist');
const OUT = path.join(ROOT, 'verification', 'evidence', 'themecolor');
fs.mkdirSync(OUT, { recursive: true });

const html = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(DIST, 'manifest.json'), 'utf8'));
const offline = fs.readFileSync(path.join(DIST, 'offline.html'), 'utf8');

const metaMatch = html.match(/<meta\s+name="theme-color"\s+content="([^"]+)"\s*\/?>/);
const offlineMatch = offline.match(/<meta\s+name="theme-color"\s+content="([^"]+)"\s*\/?>/);

const checks = [
  {
    name: 'dist/index.html meta theme-color = #c59b27 (brand gold token)',
    pass: Boolean(metaMatch && metaMatch[1] === '#c59b27'),
    actual: metaMatch ? metaMatch[1] : 'meta tag missing',
  },
  {
    name: 'manifest theme_color = #c59b27 (unified with meta)',
    pass: manifest.theme_color === '#c59b27',
    actual: manifest.theme_color,
  },
  {
    name: 'manifest background_color = #f8fafc (matches light fast-paint shell)',
    pass: manifest.background_color === '#f8fafc',
    actual: manifest.background_color,
  },
  {
    name: 'offline.html keeps intentional dark theme-color #0a0a12',
    pass: Boolean(offlineMatch && offlineMatch[1] === '#0a0a12'),
    actual: offlineMatch ? offlineMatch[1] : 'meta tag missing',
  },
  {
    name: 'meta theme-color === manifest theme_color (no split values)',
    pass: Boolean(metaMatch && metaMatch[1] === manifest.theme_color),
    actual: `meta=${metaMatch && metaMatch[1]} manifest=${manifest.theme_color}`,
  },
];

const allPass = checks.every((c) => c.pass);
const results = { generatedAt: new Date().toISOString(), allPass, checks };
fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 2));

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}  [${c.actual}]`);
console.log(allPass ? 'THEME-COLOR: ALL CHECKS PASS' : 'THEME-COLOR: FAILURES PRESENT');
process.exit(allPass ? 0 : 1);
