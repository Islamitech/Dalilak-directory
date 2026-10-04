import * as fs from 'fs';
import * as path from 'path';

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

const isApplyMode = process.argv.includes('--apply');
const isDryRun = !isApplyMode || process.argv.includes('--dry-run');

console.log('====================================================');
console.log(`MODE: ${isDryRun ? 'DRY-RUN (No database writes)' : 'APPLY (Writing to database)'}`);
console.log('====================================================');

const draftsPath = path.join(process.cwd(), '_backup_original', 'seo_generated_drafts.json');
if (!fs.existsSync(draftsPath)) {
  console.error('Drafts file not found at:', draftsPath);
  process.exit(1);
}

const drafts = JSON.parse(fs.readFileSync(draftsPath, 'utf8'));
const approved = drafts.filter((d: any) => d.seo_status === 'approved');

console.log(`Total drafts: ${drafts.length}`);
console.log(`Approved records ready to apply: ${approved.length}`);
console.log(`Rejected records skipped: ${drafts.length - approved.length}`);

if (isDryRun) {
  console.log('\n[DRY RUN SUMMARY]');
  console.log(`- Would update ${approved.length} rows in public.businesses table.`);
  console.log(`- Columns to update: seo_title, seo_description, seo_intro, seo_keywords_internal, seo_faq, seo_status, seo_source_fields, seo_generated_at, seo_reviewed_by.`);
  console.log(`- Original columns (description, name_ar, etc.) are 100% UNTOUCHED.`);
  console.log('- Dry-run completed with zero writes.');
  process.exit(0);
}

// If --apply was given, check for explicit confirmation
console.log('SAFETY CHECK: Production write requires user instruction "APPLY SEO CONTENT".');
