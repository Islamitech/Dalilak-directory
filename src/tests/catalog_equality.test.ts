import assert from 'node:assert/strict';
import { catalogsEqual } from '../services/catalogState';

console.log('=== RUNNING CATALOG EQUALITY TESTS ===\n');

// 1. Same object with different key order => equal
const objA: any = [
  {
    id: 'biz_1',
    nameAr: 'محل تجاري',
    createdDate: '2026-01-01',
    details: { alpha: 1, beta: 2 },
    tags: ['a', 'b'],
  },
];
const objB: any = [
  {
    tags: ['a', 'b'],
    details: { beta: 2, alpha: 1 },
    createdDate: '2026-01-01',
    nameAr: 'محل تجاري',
    id: 'biz_1',
  },
];
assert.equal(
  catalogsEqual(objA, objB),
  true,
  'Catalogs with different key order must be equal'
);
console.log('✓ Test 1 Passed: Same object with different key order => equal');

// 2. Different nested value => not equal
const objC: any = [
  {
    tags: ['a', 'b'],
    details: { beta: 999, alpha: 1 },
    createdDate: '2026-01-01',
    nameAr: 'محل تجاري',
    id: 'biz_1',
  },
];
assert.equal(
  catalogsEqual(objA, objC),
  false,
  'Catalogs with different nested values must not be equal'
);
console.log('✓ Test 2 Passed: Different nested value => not equal');

// 3. Arrays keep order => equal when order matches, not equal when order differs
const item1: any = { id: '1', nameAr: 'الأول' };
const item2: any = { id: '2', nameAr: 'الثاني' };
assert.equal(catalogsEqual([item1, item2], [item1, item2]), true, 'Identical array order must be equal');
assert.equal(catalogsEqual([item1, item2], [item2, item1]), false, 'Different array order must NOT be equal');

// Nested arrays keep order
const nestedArr1: any = [{ id: '1', tags: ['x', 'y'] }];
const nestedArr2: any = [{ id: '1', tags: ['y', 'x'] }];
assert.equal(catalogsEqual(nestedArr1, nestedArr2), false, 'Nested arrays with different order must NOT be equal');
console.log('✓ Test 3 Passed: Arrays keep order');

// 4. Undefined vs missing behaves consistently and is documented in one comment
// Policy: Strict key presence (a property explicitly set to undefined is not equal to a missing/omitted key)
const withUndefinedProp: any = [{ id: '1', optionalField: undefined }];
const withoutProp: any = [{ id: '1' }];
assert.equal(
  catalogsEqual(withUndefinedProp, withoutProp),
  false,
  'Explicit undefined is not equal to missing property'
);
assert.equal(
  catalogsEqual(withoutProp, withUndefinedProp),
  false,
  'Symmetric: missing property is not equal to explicit undefined'
);
const bothUndefined: any = [{ id: '1', optionalField: undefined }];
assert.equal(
  catalogsEqual(withUndefinedProp, bothUndefined),
  true,
  'Both having explicit undefined must be equal'
);
console.log('✓ Test 4 Passed: Undefined vs missing behaves consistently');

console.log('\nALL CATALOG EQUALITY TESTS PASSED!');
