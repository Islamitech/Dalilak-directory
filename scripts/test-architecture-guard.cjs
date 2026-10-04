const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawnSync } = require('child_process');
const { resolveImportPath } = require('./check-architecture.cjs');

console.log('🧪 Running Architecture Guard Test Suite...\n');

// =========================================================================
// TEST 1: Platform-Independent Windows Path Normalization Unit Test
// =========================================================================
// This test uses path.win32 to simulate Windows path resolution on ANY OS (Linux, macOS, Windows).
// Without `p.normalize(resolved)` in check-architecture.cjs, barrel resolution via
// '/index.ts' produces mixed separators ('C:\project\src\features\atlas/index.ts')
// which does NOT match the graph key ('C:\project\src\features\atlas\index.ts').
// This assertion strictly fails without the fix on BOTH Linux and Windows.
// =========================================================================
console.log('--- Test 1: Platform-Independent Windows Path Normalization (path.win32) ---');

const mockFs = {
  existsSync(p) {
    // Both normalized and un-normalized Windows paths are acknowledged by filesystem
    const normalized = p.replace(/\\/g, '/');
    return normalized === 'C:/project/src/features/atlas/index.ts';
  },
  statSync(p) {
    return { isFile: () => true };
  },
};

const winDir = 'C:\\project\\src\\components\\atlas';
const winImport = '../../features/atlas';

const resolvedWinPath = resolveImportPath(winDir, winImport, {
  path: path.win32,
  fs: mockFs,
});

console.log('Resolved path:', resolvedWinPath);

// 1. Assert no forward slashes in resolved Windows path
if (resolvedWinPath && resolvedWinPath.includes('/')) {
  console.error(`❌ FAILED: Resolved path contains un-normalized forward slash: "${resolvedWinPath}"`);
  console.error('Expected canonical Windows path with backslashes only.');
  process.exit(1);
}

// 2. Assert exact canonical match
const expectedCanonicalWinPath = 'C:\\project\\src\\features\\atlas\\index.ts';
assert.strictEqual(
  resolvedWinPath,
  expectedCanonicalWinPath,
  `Resolved path "${resolvedWinPath}" must match canonical Windows path "${expectedCanonicalWinPath}"`
);

// 3. Assert graph lookup succeeds
const mockGraph = new Map();
mockGraph.set(expectedCanonicalWinPath, ['C:\\project\\src\\components\\atlas\\HadayekAtlasNavigator.tsx']);

if (!mockGraph.has(resolvedWinPath)) {
  console.error(`❌ FAILED: mockGraph.has("${resolvedWinPath}") is false! Cycle detection will fail.`);
  process.exit(1);
}

console.log('✅ Test 1 Passed: Windows-style path resolution correctly normalizes mixed separators across all platforms.\n');

// =========================================================================
// TEST 2: Filesystem Integration Test (Cycle detection via barrel)
// =========================================================================
console.log('--- Test 2: Filesystem Integration Test (Cycle through index.ts barrel) ---');

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'arch-guard-test-'));

try {
  // Minimal App.tsx
  fs.writeFileSync(path.join(tempDir, 'App.tsx'), 'export default function App() { return null; }\n');

  const compDir = path.join(tempDir, 'components');
  const featDir = path.join(tempDir, 'features', 'barrel');
  fs.mkdirSync(compDir, { recursive: true });
  fs.mkdirSync(featDir, { recursive: true });

  const compA = path.join(compDir, 'CompA.tsx');
  const barrelIndex = path.join(featDir, 'index.ts');

  // Case 2A: Cyclic import through index.ts barrel
  fs.writeFileSync(compA, "import { helper } from '../features/barrel';\nexport const CompA = () => null;\n");
  fs.writeFileSync(barrelIndex, "export { CompA } from '../../components/CompA';\nexport const helper = () => 1;\n");

  const checkArchScript = path.resolve(__dirname, 'check-architecture.cjs');

  const cyclicResult = spawnSync(process.execPath, [checkArchScript], {
    env: { ...process.env, ARCH_CHECK_SRC_DIR: tempDir },
    encoding: 'utf8',
  });

  if (cyclicResult.status === 0) {
    console.error('❌ Failed: Expected circular import through index.ts barrel to exit non-zero, but got exit code 0.');
    console.error('Output:\n', cyclicResult.stdout, cyclicResult.stderr);
    process.exit(1);
  }

  const output = (cyclicResult.stdout || '') + (cyclicResult.stderr || '');
  if (!output.includes('Circular import detected')) {
    console.error('❌ Failed: Expected output to mention "Circular import detected", but got:\n', output);
    process.exit(1);
  }

  console.log('✅ Case 2A Passed: Cyclic import through index.ts barrel correctly exited non-zero with error report.');

  // Case 2B: Non-cyclic case (remove backward import from barrel)
  fs.writeFileSync(barrelIndex, 'export const helper = () => 1;\n');

  const nonCyclicResult = spawnSync(process.execPath, [checkArchScript], {
    env: { ...process.env, ARCH_CHECK_SRC_DIR: tempDir },
    encoding: 'utf8',
  });

  if (nonCyclicResult.status !== 0) {
    console.error(`❌ Failed: Expected non-cyclic case to exit 0, but got exit code ${nonCyclicResult.status}.`);
    console.error('Output:\n', nonCyclicResult.stdout, nonCyclicResult.stderr);
    process.exit(1);
  }

  console.log('✅ Case 2B Passed: Non-cyclic architecture check correctly exited 0.');
  console.log('🎉 Architecture Guard tests passed 100% on current OS.\n');
} finally {
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch {}
}
