import test from 'node:test';
import assert from 'node:assert';
import { encodePayload, decodePayload } from '../src/lib/codec.ts';
import { assign } from '../src/lib/assign.ts';
import fs from 'node:fs';

const deckBasic = JSON.parse(fs.readFileSync(new URL('../src/data/deck-basic.json', import.meta.url), 'utf-8'));

test('result encoding round trip', () => {
  const resultPayload = {
    p: "Party A",
    g: ["Alice", "Bob", "Charlie", "Dave"],
    s: 12345,
    r: [true, false, true, true]
  };
  
  const encoded = encodePayload(resultPayload);
  const decoded = decodePayload(encoded);
  
  assert.deepStrictEqual(decoded, resultPayload);
});

test('carried-over missions appear in the next assignment', () => {
  const guests = ["Alice", "Bob"];
  // Mock failed missions
  const carryOverMissions = [
    { id: "m1", text: "Failed mission 1", difficulty: 1 },
    { id: "m2", text: "Failed mission 2", difficulty: 2 }
  ];
  
  const assignments = assign(guests, deckBasic, 999, carryOverMissions);
  
  // Since there are 2 guests and 2 carry-over missions, they should both get the carry-over missions
  const assignedIds = assignments.map(a => a.mission.id);
  assert.ok(assignedIds.includes("m1"));
  assert.ok(assignedIds.includes("m2"));
});

test('history never exceeds three parties', () => {
  // This tests the logic that will be used in the Result screen to build the carry payload
  const currentHistory = [
    { a: "A1", b: "B1", l: "L1" },
    { a: "A2", b: "B2", l: "L2" },
    { a: "A3", b: "B3", l: "L3" }
  ];
  
  const newCompletedPair = { a: "A4", b: "B4", l: "L4" };
  
  const nextHistory = [...currentHistory, newCompletedPair].slice(-3);
  
  assert.strictEqual(nextHistory.length, 3);
  assert.strictEqual(nextHistory[0].a, "A2");
  assert.strictEqual(nextHistory[2].a, "A4");
});
