const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

console.log('🧪 Testing Architecture Guard Circular Dependency Detection...');

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'arch-guard-test-'));

try {
  // Setup minimal valid App.tsx
  fs.writeFileSync(path.join(tempDir, 'App.tsx'), 'export default function App() { return null; }\n');

  // Create component directory and feature barrel directory
  const compDir = path.join(tempDir, 'components');
  const featDir = path.join(tempDir, 'features', 'barrel');
  fs.mkdirSync(compDir, { recursive: true });
  fs.mkdirSync(featDir, { recursive: true });

  const compA = path.join(compDir, 'CompA.tsx');
  const barrelIndex = path.join(featDir, 'index.ts');

  // Case 1: Cyclic import through index.ts barrel
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

  console.log('✅ Case 1 passed: Cyclic import through index.ts barrel correctly exited non-zero with error report.');

  // Case 2: Non-cyclic case (remove backward import from barrel)
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

  console.log('✅ Case 2 passed: Non-cyclic architecture check correctly exited 0.');
  console.log('🎉 Architecture Guard regression test passed 100% on current OS.\n');
} finally {
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch {}
}
