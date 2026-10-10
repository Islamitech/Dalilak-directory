const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const DIST = path.resolve(__dirname, '../dist');

if (!fs.existsSync(DIST)) {
  console.error('❌ dist/ directory not found. Please run "npm run build" first.');
  process.exit(1);
}

const BUDGETS = [
  { pattern: /^assets\/index-.*\.js$/, maxKb: 155, name: 'Main Entry Bundle (index-*.js)', isMainEntry: true },
  { pattern: /^assets\/index-.*\.css$/, maxKb: 161, name: 'Global Stylesheet (index-*.css)' },
  { pattern: /^assets\/react-vendor-.*\.js$/, maxKb: 250, name: 'React Vendor Chunk' },
  { pattern: /^assets\/supabase-vendor-.*\.js$/, maxKb: 245, name: 'Supabase Vendor Chunk' },
  { pattern: /^assets\/MapView-.*\.js$/, maxKb: 160, name: 'Map View Lazy Chunk' },
  { pattern: /^assets\/SearchView-.*\.js$/, maxKb: 44, name: 'Search View Lazy Chunk' },
  { pattern: /^assets\/ActivityDetailModal-.*\.js$/, maxKb: 15, name: 'Activity Detail Modal Lazy Chunk' },
  { pattern: /^assets\/atlas-geodata-.*\.js$/, maxKb: 14, name: 'Atlas Geodata Chunk' },
  { pattern: /^assets\/UnifiedBusinessCard-.*\.js$/, maxKb: 42, name: 'Unified Business Card Chunk' },
  { pattern: /^assets\/zone_.*\.js$/, maxKb: 18, name: 'Hadayek Zone Coordinates Chunk', checkAll: true },
];

function getFiles(dir) {
  let results = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, item.name);
    if (item.isDirectory()) results = results.concat(getFiles(p));
    else results.push(p);
  }
  return results;
}

const files = getFiles(DIST);
const indexHtmlPath = path.join(DIST, 'index.html');
const indexHtml = fs.existsSync(indexHtmlPath) ? fs.readFileSync(indexHtmlPath, 'utf8') : '';
const mainEntryMatch = indexHtml.match(/src="\/assets\/(index-[^"]+\.js)"/);
const mainEntryRelativePath = mainEntryMatch ? `assets/${mainEntryMatch[1]}` : null;
let failed = false;

console.log('\n========================================');
console.log('📦 DALILAK BUNDLE BUDGET ENFORCEMENT');
console.log('========================================');

BUDGETS.forEach(({ pattern, maxKb, name, isMainEntry, checkAll }) => {
  const matches = files.filter((f) => {
    const rel = path.relative(DIST, f).replace(/\\/g, '/');
    return pattern.test(rel);
  });

  if (matches.length === 0) {
    console.warn(`⚠️  Warning: Target chunk for "${name}" not found.`);
    return;
  }

  const targetsToCheck = (() => {
    if (checkAll) return matches;
    if (isMainEntry && mainEntryRelativePath) {
      const entryFile = matches.find((f) => path.relative(DIST, f).replace(/\\/g, '/') === mainEntryRelativePath);
      if (entryFile) return [entryFile];
    }
    return [matches.sort((a, b) => fs.statSync(b).size - fs.statSync(a).size)[0]];
  })();

  targetsToCheck.forEach((match) => {
    const content = fs.readFileSync(match);
    const rawKb = content.length / 1000;
    const gzipKb = zlib.gzipSync(content).length / 1000;
    const relPath = path.relative(DIST, match).replace(/\\/g, '/');

    const status = rawKb <= maxKb ? '✅ PASS' : '❌ FAIL (EXCEEDED)';
    console.log(
      `${status} [${name}]\n   File: ${relPath}\n   Raw: ${rawKb.toFixed(2)} kB / Budget: ${maxKb} kB (Gzip: ${gzipKb.toFixed(2)} kB)`
    );

    if (rawKb > maxKb) {
      failed = true;
    }
  });
});

console.log('========================================\n');

if (failed) {
  console.error('❌ Bundle budget check failed. One or more chunks exceeded the allowed threshold.');
  process.exit(1);
} else {
  console.log('🎉 All bundle chunks are strictly within their performance budgets!');
  process.exit(0);
}
