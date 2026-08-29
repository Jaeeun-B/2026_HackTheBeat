import test from 'node:test';
import assert from 'node:assert';
import { getPartnerConnection } from '../src/lib/pairing.ts';

test('partner connection logic', () => {
  const assignments = [
    { name: 'A', pairId: 'p1', partnerIndex: 1 },
    { name: 'B', pairId: 'p1', partnerIndex: 0 },
    { name: 'C', pairId: null, partnerIndex: null }
  ];

  // At index 0, A is revealed. B is at index 1 (not yet revealed).
  assert.strictEqual(getPartnerConnection(assignments, 0), null, 'Connection should be null because partner is not revealed yet');

  // At index 1, B is revealed. A is at index 0 (already revealed).
  const connB = getPartnerConnection(assignments, 1);
  assert.ok(connB !== null, 'Connection should be computed after both members are revealed');
  assert.strictEqual(connB.partnerName, 'A', 'Partner name should be correct');
  assert.strictEqual(connB.pairId, 'p1', 'Pair ID should be correct');

  // At index 2, C is revealed. C has no partner.
  assert.strictEqual(getPartnerConnection(assignments, 2), null, 'Connection should be null for solo missions');
});
