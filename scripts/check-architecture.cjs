const fs = require('fs');
const path = require('path');

/**
 * Resolves relative module imports with extension probe and normalization.
 * Options allow injecting path and fs implementations for platform-independent unit testing.
 */
function resolveImportPath(dir, importPath, options = {}) {
  const p = options.path || path;
  const f = options.fs || fs;
  if (!importPath.startsWith('.')) return null;

  let resolved = p.resolve(dir, importPath);
  const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx'];
  for (const ext of extensions) {
    const candidate = resolved + ext;
    if (f.existsSync(candidate) && f.statSync(candidate).isFile()) {
      resolved = candidate;
      break;
    }
  }
  resolved = p.normalize(resolved);
  if (f.existsSync(resolved) && f.statSync(resolved).isFile()) {
    return resolved;
  }
  return null;
}

function runArchitectureCheck() {
  const ROOT = path.resolve(__dirname, '..');
  const SRC = process.env.ARCH_CHECK_SRC_DIR ? path.resolve(process.env.ARCH_CHECK_SRC_DIR) : path.join(ROOT, 'src');

  let errors = [];

  console.log('\n========================================');
  console.log('🏗️  DALILAK ARCHITECTURE & MODULE CHECK');
  console.log('========================================');

  // Helper: recursively collect source files
  function getAllSourceFiles(dir) {
    let results = [];
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, item.name);
      if (item.isDirectory()) {
        if (item.name === 'node_modules' || item.name === 'dist' || item.name === 'tests' || item.name === '__tests__') continue;
        results = results.concat(getAllSourceFiles(full));
      } else if (/\.(tsx?|jsx?)$/.test(item.name)) {
        results.push(full);
      }
    }
    return results;
  }

  const sourceFiles = getAllSourceFiles(SRC);

  // 1. Check App.tsx line count (must be <= 150 lines)
  const appTsxPath = path.join(SRC, 'App.tsx');
  if (fs.existsSync(appTsxPath)) {
    const appLines = fs.readFileSync(appTsxPath, 'utf8').split('\n').length;
    if (appLines > 150) {
      errors.push(`App.tsx has ${appLines} lines (must be <= 150 lines composition root).`);
    } else {
      console.log(`✅ App.tsx is a slim composition root (${appLines} lines <= 150 lines).`);
    }
  } else {
    errors.push('src/App.tsx not found.');
  }

  // 2. Component line count <= 250 lines
  const componentFiles = sourceFiles.filter((f) => {
    const rel = path.relative(SRC, f).replace(/\\/g, '/');
    const isHook = rel.includes('/hooks/') || path.basename(rel).startsWith('use');
    return f.endsWith('.tsx') && !isHook;
  });
  let compViolations = 0;
  componentFiles.forEach((f) => {
    const lines = fs.readFileSync(f, 'utf8').split('\n').length;
    if (lines > 250) {
      const rel = path.relative(SRC, f).replace(/\\/g, '/');
      errors.push(`Component "${rel}" exceeds limit: ${lines} lines (must be <= 250 lines).`);
      compViolations++;
    }
  });
  if (compViolations === 0) {
    console.log(`✅ All ${componentFiles.length} UI components adhere to <= 250 lines limit.`);
  }

  // 3. Hook line count <= 120 lines
  const hookFiles = sourceFiles.filter((f) => {
    const rel = path.relative(SRC, f).replace(/\\/g, '/');
    return rel.includes('/hooks/') || path.basename(rel).startsWith('use');
  });
  let hookViolations = 0;
  hookFiles.forEach((f) => {
    const lines = fs.readFileSync(f, 'utf8').split('\n').length;
    if (lines > 120) {
      const rel = path.relative(SRC, f).replace(/\\/g, '/');
      errors.push(`Hook "${rel}" exceeds limit: ${lines} lines (must be <= 120 lines).`);
      hookViolations++;
    }
  });
  if (hookViolations === 0) {
    console.log(`✅ All ${hookFiles.length} custom hooks adhere to <= 120 lines limit.`);
  }

  // 4. No cross-feature deep imports
  let deepImportViolations = 0;
  const IMPORT_FEATURE_REGEX = /(?:import|export)\s+(?:(?:(?:\*\s+as\s+\w+)|(?:[\w\s{},*]+))\s+from\s+)?['"]([^'"]+)['"]/g;

  sourceFiles.forEach((filePath) => {
    const rel = path.relative(SRC, filePath).replace(/\\/g, '/');
    const content = fs.readFileSync(filePath, 'utf8');
    let match;
    while ((match = IMPORT_FEATURE_REGEX.exec(content)) !== null) {
      const importPath = match[1];
      if (importPath.includes('features/')) {
        const parts = importPath.split('features/')[1].split('/');
        // Deep import if path has subdirectories beyond feature root (e.g. features/map/model/...)
        if (parts.length > 1 && !parts[1].startsWith('index')) {
          const currentFeature = rel.startsWith('features/') ? rel.split('/')[1] : null;
          const targetFeature = parts[0];
          if (currentFeature !== targetFeature) {
            errors.push(`Cross-feature deep import in "${rel}": "${importPath}". Features must only be imported via their public API (features/${targetFeature}).`);
            deepImportViolations++;
          }
        }
      }
    }
  });
  if (deepImportViolations === 0) {
    console.log(`✅ Zero cross-feature deep imports detected. All feature imports go through public APIs.`);
  }

  // 5. No forbidden physical-direction classes (RTL enforcement)
  const PHYSICAL_DIRECTION_REGEX = /\b(ml-(?:\d+|auto|\[[^\]]+\])|mr-(?:\d+|auto|\[[^\]]+\])|pl-\d+|pr-\d+|border-[lr](?:-\d+)?|rounded-[lr](?:-\w+)?|rounded-(?:tl|tr|bl|br)(?:-\w+)?|left-(?:\d+|full|\[[^\]]+\])|right-(?:\d+|full|\[[^\]]+\])|left-0\b|right-0\b|float-(?:left|right)|space-x-(?:reverse|\d+|\[[^\]]+\])?|divide-x-(?:reverse|\d+|\[[^\]]+\])?|text-(?:left|right))\b/g;

  let rtlViolations = 0;
  sourceFiles.forEach((filePath) => {
    const rel = path.relative(SRC, filePath).replace(/\\/g, '/');
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/);

    lines.forEach((line, idx) => {
      // Allowlist: Centering idiom (left-1/2 with -translate-x-1/2)
      const isCenteringIdiom = (line.includes('left-1/2') || line.includes('left-[50%]')) && line.includes('-translate-x-1/2');
      // Allowlist: Explicit comment allowlist
      const hasAllowlistComment = line.includes('rtl-allow') || line.includes('allowlist: centering');
      if (isCenteringIdiom || hasAllowlistComment) return;

      const matches = line.match(PHYSICAL_DIRECTION_REGEX);
      if (matches) {
        errors.push(`Forbidden physical-direction class in "${rel}:${idx + 1}": ${matches.join(', ')}. Use logical utilities (ms-, me-, ps-, pe-, border-s, border-e, text-start, text-end, inset-inline-start).`);
        rtlViolations++;
      }
    });
  });
  if (rtlViolations === 0) {
    console.log(`✅ Zero forbidden physical-direction classes detected. RTL logical utilities strictly used.`);
  }

  // 6. Build import graph to detect circular dependencies
  const importGraph = new Map();
  const IMPORT_REGEX = /(?:import|export)\s+(?:(?:(?:\*\s+as\s+\w+)|(?:[\w\s{},*]+))\s+from\s+)?['"]([^'"]+)['"]/g;

  sourceFiles.forEach((filePath) => {
    const content = fs.readFileSync(filePath, 'utf8');
    const dir = path.dirname(filePath);
    const imports = [];
    let match;

    while ((match = IMPORT_REGEX.exec(content)) !== null) {
      const importPath = match[1];
      const resolved = resolveImportPath(dir, importPath);
      if (resolved) {
        imports.push(resolved);
      }
    }

    importGraph.set(filePath, imports);
  });

  // DFS Circular dependency detection
  const visited = new Set();
  const recursionStack = new Set();
  const cycles = [];

  function checkCycle(node, currentPath) {
    visited.add(node);
    recursionStack.add(node);

    const neighbors = importGraph.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        checkCycle(neighbor, [...currentPath, neighbor]);
      } else if (recursionStack.has(neighbor)) {
        const cycleStart = currentPath.indexOf(neighbor);
        if (cycleStart !== -1) {
          cycles.push([...currentPath.slice(cycleStart), neighbor]);
        }
      }
    }

    recursionStack.delete(node);
  }

  for (const file of sourceFiles) {
    if (!visited.has(file)) {
      checkCycle(file, [file]);
    }
  }

  if (cycles.length > 0) {
    cycles.forEach((cycle) => {
      const formatted = cycle.map((p) => path.relative(SRC, p).replace(/\\/g, '/')).join(' -> ');
      errors.push(`Circular import detected: ${formatted}`);
    });
  } else {
    console.log(`✅ Zero circular imports detected across ${sourceFiles.length} source files.`);
  }

  // 7. Shared/lib purity check (must not import React components or UI)
  const sharedLibFiles = sourceFiles.filter((f) => f.includes(path.join('shared', 'lib')));
  sharedLibFiles.forEach((f) => {
    const content = fs.readFileSync(f, 'utf8');
    if (content.includes('from \'../ui') || content.includes('from \'../../components')) {
      errors.push(`shared/lib file "${path.relative(SRC, f)}" has forbidden UI dependency.`);
    }
  });
  console.log(`✅ shared/lib purity verified (${sharedLibFiles.length} pure utility files).`);

  // 8. Sandbox isolation: directory-experience must never be imported into production application
  let sandboxLeakViolations = 0;
  sourceFiles.forEach((filePath) => {
    const rel = path.relative(SRC, filePath).replace(/\\/g, '/');
    if (!rel.startsWith('directory-experience/')) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (/['"][^'"]*directory-experience/.test(content)) {
        errors.push(`Production file "${rel}" illegally imports from sandbox "directory-experience".`);
        sandboxLeakViolations++;
      }
    }
  });
  if (sandboxLeakViolations === 0) {
    console.log(`✅ Sandbox isolation verified: 0 production files import from directory-experience.`);
  }

  console.log('========================================\n');

  if (errors.length > 0) {
    console.error(`❌ Architecture check failed with ${errors.length} error(s):`);
    errors.forEach((err) => console.error(`   - ${err}`));
    process.exit(1);
  } else {
    console.log('🎉 Architecture checks passed with 100% compliance!');
    process.exit(0);
  }
}

if (require.main === module) {
  runArchitectureCheck();
} else {
  module.exports = {
    resolveImportPath,
    runArchitectureCheck,
  };
}
