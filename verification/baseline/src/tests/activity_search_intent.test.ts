import assert from 'node:assert/strict';
import { parseActivitySearchIntent as parse } from '../utils/activitySearchIntent';
for (const [query,zone] of [['صيدليات','all'],['صيدليات منطقة ح','ح'],['صيدليات أ','أ'],['صيدليات ا','أ'],['صيدليات في منطقة ح','ح'],['صَيْدَلِيَّات منطقة أ','أ'],['صيدليات هـ','هـ']]) {
  assert.equal(parse(query)?.category,'pharmacy',query); assert.equal(parse(query)?.zone,zone,query);
}
for (const query of ['', 'صيدلية الشفاء', '222 ح', 'صيدليات منطقة ق', 'صيدليات ح الشفاء']) assert.equal(parse(query),null,query);
assert.ok(parse('مطاعم منطقة ح'));
console.log('PASS: category-only city scope, explicit districts, Arabic normalization and free-text safety');
