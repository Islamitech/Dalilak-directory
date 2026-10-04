const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');

let errors = [];

console.log('\n========================================');
console.log('🏗️  DALILAK ARCHITECTURE & MODULE CHECK');
console.log('========================================');

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

// 2. Build import graph to detect circular dependencies
function getAllSourceFiles(dir) {
  let results = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      if (item.name === 'node_modules' || item.name === 'dist' || item.name === 'tests') continue;
      results = results.concat(getAllSourceFiles(full));
    } else if (/\.(tsx?|jsx?)$/.test(item.name)) {
      results.push(full);
    }
  }
  return results;
}

const sourceFiles = getAllSourceFiles(SRC);
const importGraph = new Map();

const IMPORT_REGEX = /(?:import|export)\s+(?:(?:(?:\*\s+as\s+\w+)|(?:[\w\s{},*]+))\s+from\s+)?['"]([^'"]+)['"]/g;

sourceFiles.forEach((filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  const dir = path.dirname(filePath);
  const imports = [];
  let match;

  while ((match = IMPORT_REGEX.exec(content)) !== null) {
    const importPath = match[1];
    if (importPath.startsWith('.')) {
      let resolved = path.resolve(dir, importPath);
      // Try extensions
      const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx'];
      for (const ext of extensions) {
        if (fs.existsSync(resolved + ext) && fs.statSync(resolved + ext).isFile()) {
          resolved = resolved + ext;
          break;
        }
      }
      if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
        imports.push(resolved);
      }
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

// 3. Shared/lib purity check (must not import React components or UI)
const sharedLibFiles = sourceFiles.filter((f) => f.includes(path.join('shared', 'lib')));
sharedLibFiles.forEach((f) => {
  const content = fs.readFileSync(f, 'utf8');
  if (content.includes('from \'../ui') || content.includes('from \'../../components')) {
    errors.push(`shared/lib file "${path.relative(SRC, f)}" has forbidden UI dependency.`);
  }
});
console.log(`✅ shared/lib purity verified (${sharedLibFiles.length} pure utility files).`);

console.log('========================================\n');

if (errors.length > 0) {
  console.error(`❌ Architecture check failed with ${errors.length} error(s):`);
  errors.forEach((err) => console.error(`   - ${err}`));
  process.exit(1);
} else {
  console.log('🎉 Architecture checks passed with 100% compliance!');
  process.exit(0);
}
