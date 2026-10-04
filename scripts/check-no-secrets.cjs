const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const PATTERNS = [
  { name: 'Google API Key', regex: /AIza[0-9A-Za-z_-]{35}/ },
  { name: 'Supabase Service Role Key', regex: /service_role/i },
  { name: 'Supabase Secret Key', regex: /sb_secret_[A-Za-z0-9_-]{15,}/ },
  { name: 'JWT Token Pattern', regex: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+/ },
  { name: '14-digit National ID', regex: /\b[23][0-9]{13}\b/ },
];

const IGNORE_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'dist-directory',
  'dist-ux-preview',
  'reports',
  'verification',
]);

const IGNORE_FILES = new Set([
  'check-no-secrets.cjs',
  'secret-check.cjs',
  'secret-scan-expanded.cjs',
  'package-lock.json',
]);

let violations = [];

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(ROOT, fullPath).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      scanDir(fullPath);
    } else if (entry.isFile()) {
      if (IGNORE_FILES.has(entry.name)) continue;
      // Only scan code, config, markdown, json
      if (!/\.(tsx?|jsx?|json|html|css|md|ya?ml|env.*)$/i.test(entry.name)) continue;

      let content;
      try {
        content = fs.readFileSync(fullPath, 'utf8');
      } catch {
        continue;
      }

      const lines = content.split(/\r?\n/);
      lines.forEach((line, index) => {
        // Skip comment lines mentioning rules or documentation
        if (line.includes('[REDACTED') || line.includes('check-no-secrets')) return;

        for (const { name, regex } of PATTERNS) {
          if (regex.test(line)) {
            // For service_role, allow Supabase SDK internal definition comments if any
            if (name === 'Supabase Service Role Key' && line.includes('service_role_key')) return;

            violations.push({
              rule: name,
              file: relPath,
              line: index + 1,
            });
          }
        }
      });
    }
  }
}

console.log('Running Dalilak secrets check over project source and configs...');
scanDir(ROOT);

if (violations.length > 0) {
  console.error(`\n❌ Found ${violations.length} secret or sensitive pattern violation(s):`);
  violations.forEach((v) => {
    console.error(`   - [${v.rule}] at ${v.file}:${v.line}`);
  });
  console.error('\nPlease redact or remove secrets before committing.\n');
  process.exit(1);
} else {
  console.log('✅ Secrets check passed: 0 exposed secrets or sensitive patterns found.');
  process.exit(0);
}
