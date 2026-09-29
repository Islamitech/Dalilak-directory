const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const { chromium, setup, rows } = require('../../verification/browser-harness.cjs');

const root = path.resolve('verification/mutation-copy');
const base = path.resolve('verification/baseline');
const tsx = path.resolve('node_modules/tsx/dist/cli.mjs');

function edit(relPath, fn) {
  const f = path.join(root, relPath);
  const oldContent = fs.readFileSync(f, 'utf8');
  const nextContent = fn(oldContent);
  if (nextContent === oldContent) throw new Error('Mutation no-op on ' + relPath);
  fs.writeFileSync(f, nextContent);
}

const modifiedFiles = [
  'src/utils/directoryFiltering.ts',
  'src/utils/directoryEnhancements.ts',
  'src/components/PublicShowcase.tsx',
  'src/components/activity/ActivityDetailModal.tsx',
  'src/shared/publicBusiness.ts',
  'src/services/catalogState.ts',
  'src/App.tsx',
  'src/tests/repair.test.ts',
  'src/tests/mutation_browser.playwright.cjs',
];

function restore() {
  for (const p of modifiedFiles) {
    if (fs.existsSync(p)) {
      const target = path.join(root, p);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(p, target);
    }
  }
}

const mutations = {
  U1: () => edit('src/utils/directoryFiltering.ts', (s) => s.replace('\n\n        }\n\n        const mainKeyword', '\n          return true;\n        }\n\n        const mainKeyword')),
  U2: () => fs.copyFileSync(path.join(base, 'src/utils/directoryEnhancements.ts'), path.join(root, 'src/utils/directoryEnhancements.ts')),
  U3: () => fs.copyFileSync(path.join(base, 'src/components/PublicShowcase.tsx'), path.join(root, 'src/components/PublicShowcase.tsx')),
  U4: () => fs.copyFileSync(path.join(base, 'src/components/PublicShowcase.tsx'), path.join(root, 'src/components/PublicShowcase.tsx')),
  U7: () => {
    fs.copyFileSync(path.join(base, 'src/components/activity/ActivityDetailModal.tsx'), path.join(root, 'src/components/activity/ActivityDetailModal.tsx'));
    edit('src/components/PublicShowcase.tsx', (s) => s.replace('key={selectedBiz.id}', ''));
  },
  B2: () => edit('src/services/catalogState.ts', (s) => s.replace('if(b&&isPublicBusiness(b))map.set(id,b);', 'if(b&&isPublicBusiness(b)){if(map.has(id))map.set(id,b);}')),
  B3: () => edit('src/services/catalogState.ts', (s) => s.replace('return deepEqual(a, b);', 'return deepEqual(a.map(({description,...r}:any)=>r), b.map(({description,...r}:any)=>r));')),
  B4: () => edit('src/App.tsx', (s) => s.replace('const live=new Map(overrides);', 'const live=new Map<string,Business|null>();')),
};

async function runSingleBrowserScenario(browser, id, port) {
  const s = await setup(browser, { width: 390, height: 844 }, port);
  const p = s.page;
  p.setDefaultTimeout(4000);
  let result = { pass: false, error: null };

  try {
    if (id === 'U3') {
      await p.goto(s.url + '/search');
      await p.waitForTimeout(600);
      await p.getByText('صيدلية ألفا', { exact: true }).first().click();
      await p.waitForTimeout(200);
      await p.goBack();
      await p.waitForTimeout(150);
      await p.goForward();
      await p.waitForTimeout(200);
      const open = (await p.getByTitle('إغلاق', { exact: true }).count()) > 0;
      result = { pass: open, detail: `Modal count on forward: ${open ? 1 : 0}` };
    } else if (id === 'U4') {
      await p.goto(s.url + '/biz/biz_alpha');
      await p.waitForTimeout(600);
      await p.getByTitle('إغلاق', { exact: true }).click();
      await p.waitForTimeout(200);
      rows[1].name_ar = 'صيدلية بيتا محدثة';
      await p.evaluate(() => window.dispatchEvent(new Event('directory:retry')));
      await p.waitForTimeout(500);
      const count = await p.getByTitle('إغلاق', { exact: true }).count();
      rows[1].name_ar = 'صيدلية بيتا';
      result = { pass: count === 0, detail: `Modal count after retry: ${count}` };
    } else if (id === 'U7') {
      await p.goto(s.url + '/search');
      await p.waitForTimeout(600);
      await p.getByText('صيدلية ألفا', { exact: true }).first().click();
      await p.getByTitle('إغلاق', { exact: true }).waitFor();
      await p.waitForTimeout(500);
      const modal = p.locator('div.fixed.inset-0.z-50').last();
      const name = modal.getByText('صيدلية بيتا', { exact: true });
      await name.waitFor({ timeout: 3000 });
      await name.click();
      await p.waitForTimeout(600);
      const after = await p.locator('div.fixed.inset-0.z-50').last().locator('img').first().getAttribute('src');
      const pass = !after.includes('fixture.test/a.svg');
      result = { pass, detail: `Image src: ${after}` };
    } else if (id === 'B4') {
      await s.context.route((u) => u.pathname === '/src/services/supabaseClient.ts', (r) =>
        r.fulfill({
          contentType: 'application/javascript',
          body: 'export const SUPABASE_REST_BASE="https://mock.supabase.co/rest/v1";export const SUPABASE_ANON_KEY="placeholder";export const supabase={channel(){const c={on(t,o,f){window.__realtime=f;return c;},subscribe(){return c;}};return c;},removeChannel(){}};',
        })
      );
      await p.goto(s.url + '/search');
      await p.waitForTimeout(600);
      let held;
      await s.context.route('**/rest/v1/businesses?**', (r) => { held = r; });
      await p.evaluate(() => window.dispatchEvent(new Event('directory:retry')));
      for (let i = 0; i < 40 && !held; i++) await p.waitForTimeout(25);
      if (!held) throw new Error('No held REST request');
      await p.evaluate((row) => window.__realtime({ eventType: 'UPDATE', new: row, old: { id: row.id } }), { ...rows[0], name_ar: 'صيدلية ألفا لحظية' });
      await p.waitForTimeout(100);
      const liveBefore = (await p.getByText('صيدلية ألفا لحظية', { exact: true }).count()) > 0;
      await held.fulfill({ contentType: 'application/json', headers: { 'content-range': '0-1/2' }, body: JSON.stringify(rows) });
      await p.waitForTimeout(300);
      const stillPresent = (await p.getByText('صيدلية ألفا لحظية', { exact: true }).count()) > 0;
      result = { pass: liveBefore && stillPresent, detail: `liveBefore=${liveBefore}, stillPresent=${stillPresent}` };
    }
  } catch (err) {
    result = { pass: false, error: err.message };
  } finally {
    rows[1].name_ar = 'صيدلية بيتا';
    await s.context.close();
  }

  return result;
}

function runUnitOnCopy(id) {
  const probeScript = `
    import assert from 'node:assert/strict';
    const id = ${JSON.stringify(id)};
    if (id === 'U1') {
      const { filterDirectoryBusinesses } = await import('./src/utils/directoryFiltering.ts');
      const fixture = { id: 'biz_alias', nameAr: 'نشاط', verificationStatus: 'verified', city: 'حدائق الأهرام', governorate: 'الجيزة', lat: 29.979184, lng: 31.106863, workingHours: 'مغلق', videos: [] };
      const options = { activityIntent: null, deferredSearchQuery: '', categoryFilter: 'all', subcategoryFilter: 'all', effectiveSearchZone: 'all', govFilter: 'الجيزة', cityFilter: 'هضبة الأهرام', openNowOnly: false, hasRatingOnly: false, hasVideoOnly: false };
      assert.equal(filterDirectoryBusinesses([fixture], options).length, 1, 'positive control');
      assert.equal(filterDirectoryBusinesses([fixture], { ...options, hasVideoOnly: true }).length, 0, 'alias early return must not skip hasVideoOnly filter');
    }
    if (id === 'U2') {
      const { getBusinessOpenStatus } = await import('./src/utils/directoryEnhancements.ts');
      assert.equal(getBusinessOpenStatus('مغلق').isOpen, false, 'مغلق must be closed');
      assert.equal(getBusinessOpenStatus('24 ساعة').isOpen, true, '24 ساعة must be open');
    }
    if (id === 'B2') {
      const { mergeCatalog } = await import('./src/services/catalogState.ts');
      const biz = { id: 'biz_1', verificationStatus: 'verified', nameAr: 'نشاط' };
      assert.equal(mergeCatalog([], new Map([[biz.id, biz]])).length, 1, 'realtime upsert unseen');
      assert.equal(mergeCatalog([biz], new Map([[biz.id, null]])).length, 0, 'realtime deletion');
    }
    if (id === 'B3') {
      const { catalogsEqual } = await import('./src/services/catalogState.ts');
      const biz = { id: 'biz_1', verificationStatus: 'verified', nameAr: 'نشاط', description: 'old' };
      assert.equal(catalogsEqual([biz], [{ ...biz, description: 'new' }]), false, 'description change detected');
      assert.equal(catalogsEqual([biz], [{ ...biz }]), true, 'identical catalogs equal');
    }
    console.log('PASS ' + id);
  `;

  const r = cp.spawnSync(process.execPath, [tsx, '--input-type=module', '-e', probeScript], {
    cwd: root,
    encoding: 'utf8',
    timeout: 15000,
  });

  return { pass: r.status === 0, exit: r.status, output: (r.stdout + r.stderr).trim() };
}

function runUnitOnReal(id) {
  const probeScript = `
    import assert from 'node:assert/strict';
    const id = ${JSON.stringify(id)};
    if (id === 'U1') {
      const { filterDirectoryBusinesses } = await import('./src/utils/directoryFiltering.ts');
      const fixture = { id: 'biz_alias', nameAr: 'نشاط', verificationStatus: 'verified', city: 'حدائق الأهرام', governorate: 'الجيزة', lat: 29.979184, lng: 31.106863, workingHours: 'مغلق', videos: [] };
      const options = { activityIntent: null, deferredSearchQuery: '', categoryFilter: 'all', subcategoryFilter: 'all', effectiveSearchZone: 'all', govFilter: 'الجيزة', cityFilter: 'هضبة الأهرام', openNowOnly: false, hasRatingOnly: false, hasVideoOnly: false };
      assert.equal(filterDirectoryBusinesses([fixture], options).length, 1, 'positive control');
      assert.equal(filterDirectoryBusinesses([fixture], { ...options, hasVideoOnly: true }).length, 0, 'alias early return must not skip hasVideoOnly filter');
    }
    if (id === 'U2') {
      const { getBusinessOpenStatus } = await import('./src/utils/directoryEnhancements.ts');
      assert.equal(getBusinessOpenStatus('مغلق').isOpen, false, 'مغلق must be closed');
      assert.equal(getBusinessOpenStatus('24 ساعة').isOpen, true, '24 ساعة must be open');
    }
    if (id === 'B2') {
      const { mergeCatalog } = await import('./src/services/catalogState.ts');
      const biz = { id: 'biz_1', verificationStatus: 'verified', nameAr: 'نشاط' };
      assert.equal(mergeCatalog([], new Map([[biz.id, biz]])).length, 1, 'realtime upsert unseen');
      assert.equal(mergeCatalog([biz], new Map([[biz.id, null]])).length, 0, 'realtime deletion');
    }
    if (id === 'B3') {
      const { catalogsEqual } = await import('./src/services/catalogState.ts');
      const biz = { id: 'biz_1', verificationStatus: 'verified', nameAr: 'نشاط', description: 'old' };
      assert.equal(catalogsEqual([biz], [{ ...biz, description: 'new' }]), false, 'description change detected');
      assert.equal(catalogsEqual([biz], [{ ...biz }]), true, 'identical catalogs equal');
    }
    console.log('PASS ' + id);
  `;

  const r = cp.spawnSync(process.execPath, [tsx, '--input-type=module', '-e', probeScript], {
    cwd: process.cwd(),
    encoding: 'utf8',
    timeout: 15000,
  });

  return { pass: r.status === 0, exit: r.status, output: (r.stdout + r.stderr).trim() };
}

async function main() {
  console.log('=== MUTATION SENSITIVITY PROOF ON COPY (verification/mutation-copy) ===\n');

  restore();

  const browser = await chromium.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
  });

  const summary = [];

  const items = ['U1', 'U2', 'U3', 'U4', 'U7', 'B2', 'B3', 'B4'];

  for (const id of items) {
    console.log(`\n================ Testing Sensitivity for ${id} ================`);
    restore();

    // 1. Show it passes on real tree
    let realResult;
    if (['U3', 'U4', 'U7', 'B4'].includes(id)) {
      realResult = await runSingleBrowserScenario(browser, id, 5291);
    } else {
      realResult = runUnitOnReal(id);
    }
    console.log(`[REAL TREE - Control] ${id}: pass = ${realResult.pass}`);

    // 2. Revert fix in COPY of repo
    mutations[id]();
    await new Promise((r) => setTimeout(r, 400));

    // 3. Show it FAILS when fix removed in COPY
    let mutantResult;
    if (['U3', 'U4', 'U7', 'B4'].includes(id)) {
      mutantResult = await runSingleBrowserScenario(browser, id, 5293);
    } else {
      mutantResult = runUnitOnCopy(id);
    }
    console.log(`[COPY - Mutant] ${id}: pass = ${mutantResult.pass} (fails: ${!mutantResult.pass})`);
    if (mutantResult.error || mutantResult.output) {
      console.log(`Failure output:\n${mutantResult.error || mutantResult.output}`);
    }

    // 4. Restore copy
    restore();

    summary.push({
      item: id,
      passesNow: realResult.pass ? 'PASS' : 'FAIL',
      failsWhenRemoved: !mutantResult.pass ? 'FAIL (Sensitive)' : 'PASS (NOT sensitive)',
      mutantOutput: mutantResult.error || mutantResult.output || mutantResult.detail,
      realOutput: realResult.detail || realResult.output || 'PASS',
    });
  }

  await browser.close();
  restore();

  console.log('\n\n========================================================================');
  console.log('FINAL SENSITIVITY SUMMARY TABLE:');
  console.log('========================================================================');
  console.log('| Test Name | Passes Now (Real Tree) | Fails When Fix Removed (Copy) |');
  console.log('|---|:---:|:---:|');
  for (const s of summary) {
    console.log(`| ${s.item} | ${s.passesNow} | ${s.failsWhenRemoved} |`);
  }
  console.log('========================================================================\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
