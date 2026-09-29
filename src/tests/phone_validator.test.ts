import assert from 'node:assert/strict';
import { isValidEgyptianPhone, normalizePhone } from '../utils/phone';

console.log('=== RUNNING REAL PHONE VALIDATOR TESTS ===\n');

// 1. Arabic-Indic digits
assert.equal(isValidEgyptianPhone('٠١١١٢٣٤٥٦٧٨'), true, 'Arabic-Indic digits must be valid');
assert.equal(normalizePhone('٠١١١٢٣٤٥٦٧٨'), '01112345678', 'Arabic-Indic digits must normalize to ASCII');

// Eastern Arabic / Persian digits
assert.equal(isValidEgyptianPhone('۰۱۱۲۳۴۵۶۷۸۹'), true, 'Persian/Eastern-Arabic digits must be valid');

// 2. International prefix +20
assert.equal(isValidEgyptianPhone('+201212345678'), true, '+20 prefix must be valid');
assert.equal(isValidEgyptianPhone('+2001212345678'), true, '+200 prefix variant must be valid');

// 3. International prefix 0020
assert.equal(isValidEgyptianPhone('00201512345678'), true, '0020 prefix must be valid');
assert.equal(isValidEgyptianPhone('002001512345678'), true, '00200 prefix variant must be valid');

// 4. Standard national format
assert.equal(isValidEgyptianPhone('01012345678'), true, '010 prefix must be valid');
assert.equal(isValidEgyptianPhone('01112345678'), true, '011 prefix must be valid');
assert.equal(isValidEgyptianPhone('01212345678'), true, '012 prefix must be valid');
assert.equal(isValidEgyptianPhone('01512345678'), true, '015 prefix must be valid');

// Formatted with spaces and hyphens
assert.equal(isValidEgyptianPhone('+20 (10) 1234-5678'), true, 'Formatted phone with spaces and dashes must be valid');

// 5. Bad prefix
assert.equal(isValidEgyptianPhone('01312345678'), false, 'Bad prefix 013 must be rejected');
assert.equal(isValidEgyptianPhone('01412345678'), false, 'Bad prefix 014 must be rejected');
assert.equal(isValidEgyptianPhone('01612345678'), false, 'Bad prefix 016 must be rejected');
assert.equal(isValidEgyptianPhone('01712345678'), false, 'Bad prefix 017 must be rejected');
assert.equal(isValidEgyptianPhone('01812345678'), false, 'Bad prefix 018 must be rejected');
assert.equal(isValidEgyptianPhone('01912345678'), false, 'Bad prefix 019 must be rejected');
assert.equal(isValidEgyptianPhone('0231234567'), false, 'Landline prefix must be rejected');

// 6. Too short or empty
assert.equal(isValidEgyptianPhone('0101234567'), false, 'Too short (10 digits) must be rejected');
assert.equal(isValidEgyptianPhone('12345'), false, 'Short number must be rejected');
assert.equal(isValidEgyptianPhone(''), false, 'Empty string must be rejected');

console.log('ALL PHONE VALIDATOR TESTS PASSED!');
