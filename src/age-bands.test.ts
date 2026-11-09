// SPDX-License-Identifier: MIT
import assert from 'node:assert/strict';
import {
  formatLrsAgeDisplay,
  formatLrsAgeShort,
  LRS_18_PLUS_DEFINITION,
  LRS_AGE_BANDS,
  LRS_AGE_BAND_PROMPT,
  normalizeLrsMinimumAge,
} from './age-bands';

assert.equal(normalizeLrsMinimumAge(0), 1);
assert.equal(normalizeLrsMinimumAge(1), 1);
assert.equal(normalizeLrsMinimumAge(2), 1);
assert.equal(normalizeLrsMinimumAge(3), 1);
assert.equal(normalizeLrsMinimumAge(4), 4);
assert.equal(normalizeLrsMinimumAge(8), 8);
assert.equal(normalizeLrsMinimumAge(13), 13);
assert.equal(normalizeLrsMinimumAge(14), 15);
assert.equal(normalizeLrsMinimumAge(15), 15);
assert.equal(normalizeLrsMinimumAge(16), 18);
assert.equal(normalizeLrsMinimumAge(17), 18);
assert.equal(normalizeLrsMinimumAge(18), 18);
assert.equal(normalizeLrsMinimumAge(21), 18);
assert.equal(normalizeLrsMinimumAge(12), 13);
assert.equal(normalizeLrsMinimumAge('nope'), 8);

assert.equal(formatLrsAgeDisplay(2), '1+');
assert.equal(formatLrsAgeDisplay(4), '4+');
assert.equal(formatLrsAgeDisplay(13), '13+');
assert.equal(formatLrsAgeDisplay(15), '15+');
assert.equal(formatLrsAgeDisplay(18), '18+');
assert.deepEqual([...LRS_AGE_BANDS], [1, 4, 8, 13, 15, 18]);
assert.ok(LRS_AGE_BAND_PROMPT.includes('13, 15, or 18'));
assert.ok(/explicit/i.test(LRS_18_PLUS_DEFINITION));
assert.equal(formatLrsAgeShort(3), '1+');
assert.equal(formatLrsAgeShort(4), '4+');

console.log('age-bands.test.ts: OK');
