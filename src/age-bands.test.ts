// SPDX-License-Identifier: MIT
import assert from 'node:assert/strict';
import {
  formatLrsAgeDisplay,
  formatLrsAgeShort,
  normalizeLrsMinimumAge,
} from './age-bands';

assert.equal(normalizeLrsMinimumAge(0), 1);
assert.equal(normalizeLrsMinimumAge(1), 1);
assert.equal(normalizeLrsMinimumAge(2), 1);
assert.equal(normalizeLrsMinimumAge(3), 1);
assert.equal(normalizeLrsMinimumAge(4), 4);
assert.equal(normalizeLrsMinimumAge(8), 8);
assert.equal(normalizeLrsMinimumAge(13), 13);
assert.equal(normalizeLrsMinimumAge(18), 18);
assert.equal(normalizeLrsMinimumAge(12), 13);
assert.equal(normalizeLrsMinimumAge(16), 18);
assert.equal(normalizeLrsMinimumAge('nope'), 8);

assert.equal(formatLrsAgeDisplay(2), '1+');
assert.equal(formatLrsAgeDisplay(4), '4+');
assert.equal(formatLrsAgeDisplay(13), '13+');
assert.equal(formatLrsAgeShort(3), '1+');
assert.equal(formatLrsAgeShort(4), '4+');

console.log('age-bands.test.ts: OK');
