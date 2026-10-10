import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  HADAYEK_OFFICIAL_DISTRICTS,
  isPointInPolygon,
  findDistrictForCoordinates,
} from '../src/shared/data/hadayek/hadayekDistrictsGeoData';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function calculateDirectDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaLat = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Zone letter to slug mapping for stable filenames
export const ZONE_SLUGS: Record<string, string> = {
  'أ': 'zone_a',
  'ب': 'zone_b',
  'ج': 'zone_g',
  'د': 'zone_d',
  'هـ': 'zone_h',
  'و': 'zone_w',
  'ز': 'zone_z',
  'ح': 'zone_ha',
  'ط': 'zone_t',
  'ك': 'zone_k',
  'ل': 'zone_l',
  'م': 'zone_m',
  'ن': 'zone_n',
  'س': 'zone_s',
  'ع': 'zone_ain',
  'ص': 'zone_sad',
};

async function main() {
  const t0 = Date.now();
  const rawPath = path.resolve(__dirname, '../src/shared/data/hadayek/hadayekBuildingsCoords.json');
  const rawDB = JSON.parse(fs.readFileSync(rawPath, 'utf8')) as Record<
    string,
    Array<{ lat: number; lng: number }>
  >;

  const outDir = path.resolve(__dirname, '../src/shared/data/hadayek/zones');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Pre-index each raw point to its district to avoid redundant polygon checks
  // Map: pointKey -> districtLetter | null
  const pointDistrictCache = new Map<string, string | null>();
  function getPointDistrictLetter(lat: number, lng: number): string | null {
    const key = `${lat},${lng}`;
    if (pointDistrictCache.has(key)) return pointDistrictCache.get(key)!;
    const d = findDistrictForCoordinates(lat, lng);
    const letter = d ? d.letterAr : null;
    pointDistrictCache.set(key, letter);
    return letter;
  }

  const zoneData: Record<string, Record<string, [number, number]>> = {};
  for (const d of HADAYEK_OFFICIAL_DISTRICTS) {
    zoneData[d.letterAr] = {};
  }

  for (const [bldgNum, records] of Object.entries(rawDB)) {
    const cleanNum = bldgNum.match(/\d+/)?.[0];
    if (!cleanNum) continue;

    for (const d of HADAYEK_OFFICIAL_DISTRICTS) {
      // Step A: Check if any record is inside this district
      let matchedRec: { lat: number; lng: number } | null = null;
      for (const rec of records) {
        const ownerLetter = getPointDistrictLetter(rec.lat, rec.lng);
        if (ownerLetter === d.letterAr) {
          matchedRec = rec;
          break;
        }
      }

      // Step B: Strict boundary fallback (<300m and not inside another official district)
      if (!matchedRec && d.polygons) {
        let closestRec: { lat: number; lng: number } | null = null;
        let minDistance = Infinity;
        for (const rec of records) {
          const ownerLetter = getPointDistrictLetter(rec.lat, rec.lng);
          if (ownerLetter && ownerLetter !== d.letterAr) continue;
          const dist = calculateDirectDistanceMeters(rec.lat, rec.lng, d.centerLat, d.centerLng);
          if (dist < 300 && dist < minDistance) {
            minDistance = dist;
            closestRec = rec;
          }
        }
        if (closestRec) {
          matchedRec = closestRec;
        }
      }

      if (matchedRec) {
        zoneData[d.letterAr][cleanNum] = [
          Number(matchedRec.lat.toFixed(6)),
          Number(matchedRec.lng.toFixed(6)),
        ];
      }
    }
  }

  // Write out each zone file
  let totalSizeKb = 0;
  for (const d of HADAYEK_OFFICIAL_DISTRICTS) {
    const slug = ZONE_SLUGS[d.letterAr] || `zone_${d.id}`;
    const filePath = path.join(outDir, `${slug}.json`);
    const entries = zoneData[d.letterAr] || {};
    const content = JSON.stringify(entries);
    fs.writeFileSync(filePath, content, 'utf8');
    const sizeKb = Buffer.byteLength(content) / 1024;
    totalSizeKb += sizeKb;
    console.log(
      `Zone ${d.letterAr} (${slug}.json): ${Object.keys(entries).length} buildings | ${sizeKb.toFixed(1)} KB`
    );
  }

  console.log(`\nDone in ${Date.now() - t0} ms! Total size across all 16 zones: ${totalSizeKb.toFixed(1)} KB`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
