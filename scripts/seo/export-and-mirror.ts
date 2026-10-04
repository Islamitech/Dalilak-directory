import * as fs from 'fs';
import * as path from 'path';

// Read local .env without printing secrets
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  }
}

loadEnv();

const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
const SUPABASE_KEY = (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim();

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase configuration in .env');
  process.exit(1);
}

async function fetchAll(table: string) {
  const allRows: any[] = [];
  const limit = 500;
  let offset = 0;
  let total = Infinity;

  while (offset < total) {
    const rangeHeader = `${offset}-${offset + limit - 1}`;
    const url = `${SUPABASE_URL}/rest/v1/${table}?select=*&order=created_at.asc,id.asc`;
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Range: rangeHeader,
        Prefer: 'count=exact'
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch ${table} (range ${rangeHeader}): HTTP ${res.status}`);
    }

    const contentRange = res.headers.get('content-range');
    if (contentRange) {
      const parts = contentRange.split('/');
      if (parts[1]) total = parseInt(parts[1], 10);
    }

    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) break;

    allRows.push(...rows);
    offset += rows.length;
    console.log(`[${table}] Fetched ${allRows.length} / ${total} rows...`);
    if (rows.length < limit) break;
  }

  return { rows: allRows, total };
}

function jsonToCsv(rows: any[]): string {
  if (!rows || rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escapeCsv = (val: any) => {
    if (val === null || val === undefined) return '';
    const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvRows = [headers.join(',')];
  for (const row of rows) {
    csvRows.push(headers.map(h => escapeCsv(row[h])).join(','));
  }
  return csvRows.join('\r\n');
}

async function main() {
  const exportDir = path.join(process.cwd(), '_backup_original');
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  console.log('=== Step 1: Exporting businesses table ===');
  const { rows: businesses, total } = await fetchAll('businesses');
  console.log(`Total businesses fetched: ${businesses.length} (reported total: ${total})`);

  const bizJsonPath = path.join(exportDir, `businesses_export_${timestamp}.json`);
  fs.writeFileSync(bizJsonPath, JSON.stringify(businesses, null, 2), 'utf8');
  console.log(`Saved JSON export to: ${bizJsonPath}`);

  const bizCsvPath = path.join(exportDir, `businesses_export_${timestamp}.csv`);
  fs.writeFileSync(bizCsvPath, jsonToCsv(businesses), 'utf8');
  console.log(`Saved CSV export to: ${bizCsvPath}`);

  // Create mirror copy for local offline processing
  const mirrorPath = path.join(exportDir, 'mirror_businesses.json');
  fs.writeFileSync(mirrorPath, JSON.stringify(businesses, null, 2), 'utf8');
  console.log(`Saved mirror copy to: ${mirrorPath}`);

  console.log('\nExport completed successfully.');
}

main().catch(err => {
  console.error('Export failed:', err);
  process.exit(1);
});
