import test from 'node:test';
import assert from 'node:assert';
import { assign } from '../src/lib/assign.ts';
import fs from 'node:fs';

const deckStr = fs.readFileSync(new URL('../src/data/deck-basic.json', import.meta.url), 'utf8');
const deck = JSON.parse(deckStr);

test('assign coverage', () => {
  // 4 guests yields 2 complete pairs
  const res4 = assign(['Alice', 'Bob', 'Charlie', 'Dave'], deck, 123);
  assert.strictEqual(res4.length, 4);
  assert.strictEqual(res4.filter(r => r.pairId !== null).length, 4);

  // 5 guests yields 2 pairs and 1 solo
  const res5 = assign(['A', 'B', 'C', 'D', 'E'], deck, 456);
  assert.strictEqual(res5.filter(r => r.pairId !== null).length, 4);
  assert.strictEqual(res5.filter(r => r.pairId === null).length, 1);

  // 12 guests yields 6 pairs
  const res12 = assign(['A','B','C','D','E','F','G','H','I','J','K','L'], deck, 789);
  assert.strictEqual(res12.filter(r => r.pairId !== null).length, 12);
  assert.strictEqual(res12.filter(r => r.pairId === null).length, 0);

  // no mission id repeats within a party
  const allIds12 = res12.map(r => r.mission.id);
  const uniqueIds12 = new Set(allIds12);
  assert.strictEqual(allIds12.length, uniqueIds12.size, 'No mission id should repeat');

  // every non-null pairId appears exactly twice
  const pairCounts = {};
  for (const r of res12) {
    if (r.pairId) {
      pairCounts[r.pairId] = (pairCounts[r.pairId] || 0) + 1;
    }
  }
  for (const count of Object.values(pairCounts)) {
    assert.strictEqual(count, 2, 'pairId must appear exactly twice');
  }

  // the same seed reproduces the same result
  const res12_again = assign(['A','B','C','D','E','F','G','H','I','J','K','L'], deck, 789);
  assert.deepStrictEqual(res12_again, res12, 'Same seed must yield same assignment');
});
