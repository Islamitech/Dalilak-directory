const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const violations = [];

// 1. Check index.html style reset & shell
const indexPath = path.join(ROOT, 'index.html');
if (!fs.existsSync(indexPath)) {
  violations.push('index.html is missing!');
} else {
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  const styleMatch = indexContent.match(/<style>([\s\S]*?)<\/style>/i);
  if (styleMatch) {
    const styleText = styleMatch[1];
    if (/border:\s*0/i.test(styleText)) {
      violations.push('index.html: unlayered border reset detected in <style> block. All global resets must be inside @layer base.');
    }
    if (/outline:[^;]*!important/i.test(styleText)) {
      violations.push('index.html: focus/outline !important override detected in <style> block.');
    }
  }
  if (!indexContent.includes('background: #f6f3ec')) {
    violations.push('index.html: fast-paint-shell should use unified warm background (#f6f3ec).');
  }
}

// 2. Check src/index.css surface tokens
const indexCssPath = path.join(ROOT, 'src', 'index.css');
if (!fs.existsSync(indexCssPath)) {
  violations.push('src/index.css is missing!');
} else {
  const indexCss = fs.readFileSync(indexCssPath, 'utf8');
  if (!/--bg-primary:\s*#f6f3ec/i.test(indexCss)) {
    violations.push('src/index.css: --bg-primary must be #f6f3ec (unified warm surface).');
  }
  if (!/--map-bg:[^;]*#f6f3ec/i.test(indexCss)) {
    violations.push('src/index.css: --map-bg must integrate the warm surface palette (#f6f3ec).');
  }
  if (!indexCss.includes('--cat-grad-other')) {
    violations.push('src/index.css: missing fallback category gradient token (--cat-grad-other).');
  }
}

// 3. Check src/styles/dl-ui.css hex count
const dlUiPath = path.join(ROOT, 'src', 'styles', 'dl-ui.css');
if (!fs.existsSync(dlUiPath)) {
  violations.push('src/styles/dl-ui.css is missing!');
} else {
  const dlUi = fs.readFileSync(dlUiPath, 'utf8');
  const hexMatches = dlUi.match(/#[0-9a-fA-F]{3,8}\b/g) || [];
  const HEX_BASELINE_CEILING = 195;
  if (hexMatches.length > HEX_BASELINE_CEILING) {
    violations.push(`src/styles/dl-ui.css: hex count (${hexMatches.length}) exceeded frozen baseline ceiling of ${HEX_BASELINE_CEILING}. Use CSS variables instead.`);
  }

  // Ensure red closed override is not reintroduced
  if (/\.dl-db\s+\.dl-sp\.dl-closed\s*\{\s*background:\s*#fef2f2/i.test(dlUi)) {
    violations.push('src/styles/dl-ui.css: red .dl-closed override in detail view detected. "Closed" is neutral, not an error.');
  }
}

// 4. Check category gradient consumption
const catVisualsPath = path.join(ROOT, 'src', 'utils', 'categoryVisuals.tsx');
if (!fs.existsSync(catVisualsPath)) {
  violations.push('src/utils/categoryVisuals.tsx is missing!');
} else {
  const catVisuals = fs.readFileSync(catVisualsPath, 'utf8');
  if (!catVisuals.includes('var(--cat-grad-other)')) {
    violations.push('src/utils/categoryVisuals.tsx: fallback gradient must reference var(--cat-grad-other).');
  }
}

// Format Output
const isReport = process.argv.includes('--report');
const now = new Date().toISOString();

console.log('========================================');
console.log('🛡️  DALILAK VISUAL TOKENS & SURFACE GUARD');
console.log('========================================');

if (violations.length === 0) {
  console.log('✅ index.html: @layer base reset & warm shell verified.');
  console.log('✅ src/index.css: Unified surface tokens & category gradients verified.');
  console.log('✅ src/styles/dl-ui.css: Hex count within frozen ceiling & neutral closed badge verified.');
  console.log('✅ src/utils/categoryVisuals.tsx: Category visual token consumption verified.');
  console.log('========================================');
  console.log('🎉 All visual token and surface guard checks passed with 100% compliance!');

  if (isReport) {
    const reportDir = path.join(ROOT, 'reports');
    if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
    const dateStr = now.split('T')[0];
    const reportPath = path.join(reportDir, `visual-guard-${dateStr}.md`);
    const reportContent = `# Dalilak Visual Guard Report (${dateStr})\n\n**Status:** PASS (100% compliant)\n**Timestamp:** ${now}\n\nAll visual tokens, cascade layers, surfaces, and color semantics are healthy.`;
    fs.writeFileSync(reportPath, reportContent, 'utf8');
    console.log(`📄 Report written to: ${reportPath}`);
  }

  process.exit(0);
} else {
  console.error(`❌ ${violations.length} visual token violation(s) found:\n`);
  violations.forEach((v, idx) => console.error(`  ${idx + 1}. ${v}`));
  console.log('========================================');

  if (isReport) {
    const reportDir = path.join(ROOT, 'reports');
    if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
    const dateStr = now.split('T')[0];
    const reportPath = path.join(reportDir, `visual-guard-${dateStr}.md`);
    const reportContent = `# Dalilak Visual Guard Report (${dateStr})\n\n**Status:** FAIL\n**Timestamp:** ${now}\n\n### Violations:\n` + violations.map((v) => `- ${v}`).join('\n');
    fs.writeFileSync(reportPath, reportContent, 'utf8');
    console.error(`📄 Violation report written to: ${reportPath}`);
  }

  process.exit(1);
}
