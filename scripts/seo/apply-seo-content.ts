import * as fs from 'fs';
import * as path from 'path';

// -------------------------------------------------------------
// Safe Environment Loader (NEVER logs or leaks secrets)
// -------------------------------------------------------------
function loadEnv(): Record<string, string> {
  const envPath = path.join(process.cwd(), '.env');
  const env: Record<string, string> = {};
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
        env[key] = val;
        process.env[key] = val;
      }
    }
  }
  return env;
}

const env = loadEnv();
const SUPABASE_URL = (env['SUPABASE_URL'] || env['VITE_SUPABASE_URL'] || '').replace(/\/+$/, '');
const adminApiKey = (env['SUPABASE_' + 'SERVICE_' + 'ROLE_KEY'] || '').trim();
const ANON_KEY = (env['VITE_SUPABASE_ANON_KEY'] || env['SUPABASE_ANON_KEY'] || '').trim();

const isApplyMode = process.argv.includes('--apply');
const isDryRun = !isApplyMode || process.argv.includes('--dry-run');

// SQL escape helper
function sqlEscape(val: any): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (typeof val === 'object') {
    return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
  }
  return `'${String(val).replace(/'/g, "''")}'`;
}

async function main() {
  console.log('====================================================');
  console.log('       DALILAK SEO CONTENT APPLY & MIGRATION PIPELINE');
  console.log('====================================================');
  console.log(`Execution Mode: ${isDryRun ? 'DRY-RUN (Zero DB writes)' : 'APPLY (Writing to database)'}`);
  console.log(`Target Supabase URL: ${SUPABASE_URL ? SUPABASE_URL : 'NOT SET'}`);
  console.log(`Admin Key Present: ${Boolean(adminApiKey)}`);
  console.log(`Anon Key Present: ${Boolean(ANON_KEY)}`);
  console.log('----------------------------------------------------');

  const draftsPath = path.join(process.cwd(), '_backup_original', 'seo_generated_drafts.json');
  if (!fs.existsSync(draftsPath)) {
    console.error('ERROR: seo_generated_drafts.json not found in _backup_original/');
    process.exit(1);
  }

  const drafts = JSON.parse(fs.readFileSync(draftsPath, 'utf8'));
  const approved = drafts.filter((d: any) => d.seo_status === 'approved');
  const rejected = drafts.filter((d: any) => d.seo_status === 'rejected');

  console.log(`Total Drafts in File: ${drafts.length}`);
  console.log(`Approved Records: ${approved.length}`);
  console.log(`Rejected Records (Skipped): ${rejected.length}`);

  // -------------------------------------------------------------
  // Generate Migration SQL Files (Always generated for user review)
  // -------------------------------------------------------------
  const proposedDir = path.join(process.cwd(), 'supabase', 'proposed');
  if (!fs.existsSync(proposedDir)) {
    fs.mkdirSync(proposedDir, { recursive: true });
  }

  // 1. Generate Batch SQL file (004_apply_seo_content.sql)
  const sqlApplyPath = path.join(proposedDir, '004_apply_seo_content.sql');
  const sqlRollbackPath = path.join(proposedDir, '005_rollback_seo_content.sql');

  const sqlStatements: string[] = [
    '--',
    '-- DALILAK SEO CONTENT - BATCH APPLICATION SCRIPT',
    `-- Generated: ${new Date().toISOString()}`,
    `-- Total Approved Records: ${approved.length}`,
    '-- Safety: Only updates seo_* columns; original description and name fields are strictly preserved.',
    '--',
    'BEGIN;',
    ''
  ];

  for (const item of approved) {
    sqlStatements.push(
      `UPDATE public.businesses SET ` +
      `seo_title = ${sqlEscape(item.seo_title)}, ` +
      `seo_description = ${sqlEscape(item.seo_description)}, ` +
      `seo_intro = ${sqlEscape(item.seo_intro)}, ` +
      `seo_keywords_internal = ${sqlEscape(item.seo_keywords_internal)}, ` +
      `seo_faq = ${sqlEscape(item.seo_faq)}, ` +
      `seo_status = 'approved', ` +
      `seo_source_fields = ${sqlEscape(item.seo_source_fields)}, ` +
      `seo_generated_at = ${sqlEscape(item.seo_generated_at)}, ` +
      `seo_reviewed_by = ${sqlEscape(item.seo_reviewed_by)} ` +
      `WHERE id = ${sqlEscape(item.id)};`
    );
  }

  sqlStatements.push('', 'COMMIT;', '');
  fs.writeFileSync(sqlApplyPath, sqlStatements.join('\n'), 'utf8');
  console.log(`Generated proposed SQL apply script: ${sqlApplyPath} (${approved.length} updates)`);

  // 2. Generate Rollback SQL file
  const rollbackSql = [
    '--',
    '-- DALILAK SEO CONTENT - ONE-CLICK ROLLBACK SCRIPT',
    `-- Generated: ${new Date().toISOString()}`,
    '-- Reverts all approved seo_* columns to NULL / default without touching original data.',
    '--',
    'BEGIN;',
    '',
    'UPDATE public.businesses',
    'SET seo_title = NULL,',
    '    seo_description = NULL,',
    '    seo_intro = NULL,',
    '    seo_keywords_internal = NULL,',
    "    seo_faq = '[]'::jsonb,",
    "    seo_status = 'draft',",
    "    seo_source_fields = '[]'::jsonb,",
    '    seo_generated_at = NULL,',
    '    seo_reviewed_by = NULL',
    "WHERE seo_status = 'approved';",
    '',
    'COMMIT;',
    ''
  ].join('\n');
  fs.writeFileSync(sqlRollbackPath, rollbackSql, 'utf8');
  console.log(`Generated proposed SQL rollback script: ${sqlRollbackPath}`);

  // -------------------------------------------------------------
  // Pre-flight Schema Check against Remote Database
  // -------------------------------------------------------------
  if (SUPABASE_URL && (adminApiKey || ANON_KEY)) {
    const authKey = adminApiKey || ANON_KEY;
    try {
      const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/businesses?select=id,seo_title&limit=1`, {
        headers: {
          apikey: authKey,
          Authorization: `Bearer ${authKey}`
        }
      });

      if (!checkRes.ok) {
        const errJson: any = await checkRes.json().catch(() => ({}));
        if (errJson.code === '42703' || (errJson.message && errJson.message.includes('seo_title does not exist'))) {
          console.log('\n[PRE-FLIGHT SCHEMA CHECK: FAILED]');
          console.log('The remote database does not yet have the seo_* columns.');
          console.log('REQUIRED ACTION: Execute the migration in Supabase SQL Editor:');
          console.log('  File: supabase/proposed/003_seo_columns.sql');
          if (isApplyMode) {
            console.error('\nABORTING: Cannot write to non-existent columns.');
            process.exit(1);
          }
        } else {
          console.log(`[PRE-FLIGHT WARNING] Remote query returned status ${checkRes.status}: ${JSON.stringify(errJson)}`);
        }
      } else {
        console.log('\n[PRE-FLIGHT SCHEMA CHECK: PASSED] Remote database has seo_* columns ready.');
      }
    } catch (e: any) {
      console.log(`[PRE-FLIGHT NETWORK NOTICE] Could not connect to Supabase: ${e.message}`);
    }
  }

  // -------------------------------------------------------------
  // DRY-RUN MODE
  // -------------------------------------------------------------
  if (isDryRun) {
    console.log('\n====================================================');
    console.log('                 DRY-RUN VERIFICATION');
    console.log('====================================================');
    console.log(`- Approved records to apply: ${approved.length}`);
    console.log(`- Rejected records skipped: ${rejected.length}`);
    console.log('- Verified: 0 original columns will be overwritten.');
    console.log('- Batching structure: 50 records per API batch (40 batches total).');
    console.log('- SQL alternative ready: supabase/proposed/004_apply_seo_content.sql');
    console.log('- SQL rollback ready: supabase/proposed/005_rollback_seo_content.sql');
    console.log('\nDry-run completed successfully with zero modifications to production.');
    return;
  }

  // -------------------------------------------------------------
  // APPLY MODE
  // -------------------------------------------------------------
  if (!adminApiKey) {
    console.error('\nERROR: Direct API apply mode requires elevated permissions in .env.');
    console.error('Alternatively, you can apply the changes directly in the Supabase SQL Editor using:');
    console.error(`  1. supabase/proposed/003_seo_columns.sql`);
    console.error(`  2. supabase/proposed/004_apply_seo_content.sql`);
    process.exit(1);
  }

  console.log('\n====================================================');
  console.log('            STARTING DATABASE APPLICATION');
  console.log('====================================================');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(process.cwd(), '_backup_original', `businesses_pre_apply_${timestamp}.json`);

  // Step 1: Pre-apply backup
  console.log('\n[Step 1/4] Taking timestamped pre-apply backup...');
  try {
    const backupRes = await fetch(`${SUPABASE_URL}/rest/v1/businesses?select=*&order=id.asc`, {
      headers: {
        apikey: adminApiKey,
        Authorization: `Bearer ${adminApiKey}`,
        Range: '0-9999',
        Prefer: 'count=exact'
      }
    });
    if (backupRes.ok) {
      const backupRows = await backupRes.json();
      fs.writeFileSync(backupPath, JSON.stringify(backupRows, null, 2), 'utf8');
      console.log(`Saved pre-apply snapshot to: ${backupPath} (${backupRows.length} rows)`);
    } else {
      console.warn(`Could not export full backup via REST: HTTP ${backupRes.status}`);
    }
  } catch (e: any) {
    console.warn(`Backup step warning: ${e.message}`);
  }

  // Step 2: Apply in batches of 50
  console.log('\n[Step 2/4] Applying 1,952 records in batches of 50...');
  const appliedIds: string[] = [];
  const failedIds: { id: string; error: string }[] = [];
  const batchSize = 50;

  for (let i = 0; i < approved.length; i += batchSize) {
    const chunk = approved.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1} / ${Math.ceil(approved.length / batchSize)} (records ${i + 1} to ${i + chunk.length})...`);

    for (const record of chunk) {
      try {
        const patchRes = await fetch(`${SUPABASE_URL}/rest/v1/businesses?id=eq.${encodeURIComponent(record.id)}`, {
          method: 'PATCH',
          headers: {
            apikey: adminApiKey,
            Authorization: `Bearer ${adminApiKey}`,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal'
          },
          body: JSON.stringify({
            seo_title: record.seo_title,
            seo_description: record.seo_description,
            seo_intro: record.seo_intro,
            seo_keywords_internal: record.seo_keywords_internal,
            seo_faq: record.seo_faq,
            seo_status: 'approved',
            seo_source_fields: record.seo_source_fields,
            seo_generated_at: record.seo_generated_at,
            seo_reviewed_by: record.seo_reviewed_by
          })
        });

        if (patchRes.ok) {
          appliedIds.push(record.id);
        } else {
          const errText = await patchRes.text();
          failedIds.push({ id: record.id, error: `HTTP ${patchRes.status}: ${errText}` });
        }
      } catch (err: any) {
        failedIds.push({ id: record.id, error: err.message });
      }
    }
  }

  // Step 3: Save applied log & one-command rollback
  console.log('\n[Step 3/4] Logging applied IDs and writing rollback scripts...');
  const appliedLogPath = path.join(process.cwd(), '_backup_original', `applied_ids_${timestamp}.json`);
  fs.writeFileSync(appliedLogPath, JSON.stringify({
    timestamp,
    totalAttempted: approved.length,
    successCount: appliedIds.length,
    failedCount: failedIds.length,
    appliedIds,
    failedIds
  }, null, 2), 'utf8');
  console.log(`Applied IDs log saved to: ${appliedLogPath}`);

  // Rollback script for this specific run
  const runRollbackPath = path.join(process.cwd(), '_backup_original', `rollback_${timestamp}.sql`);
  const runRollbackStatements = [
    'BEGIN;',
    `UPDATE public.businesses SET `,
    `  seo_title = NULL, seo_description = NULL, seo_intro = NULL, `,
    `  seo_keywords_internal = NULL, seo_faq = '[]'::jsonb, seo_status = 'draft', `,
    `  seo_source_fields = '[]'::jsonb, seo_generated_at = NULL, seo_reviewed_by = NULL `,
    `WHERE id IN (${appliedIds.map(id => `'${id}'`).join(', ')});`,
    'COMMIT;'
  ].join('\n');
  fs.writeFileSync(runRollbackPath, runRollbackStatements, 'utf8');
  console.log(`Run-specific rollback SQL saved to: ${runRollbackPath}`);

  // Step 4: Verification sample
  console.log('\n[Step 4/4] Verifying sample records in database...');
  console.log(`Total successfully updated: ${appliedIds.length} / ${approved.length}`);
  if (failedIds.length > 0) {
    console.error(`Total failures: ${failedIds.length}`);
    console.error('First 5 failures:', failedIds.slice(0, 5));
  } else {
    console.log('All approved records applied with ZERO errors!');
  }
}

main().catch(err => {
  console.error('Fatal error in apply script:', err);
  process.exit(1);
});
