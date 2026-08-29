import test from 'node:test';
import assert from 'node:assert';
import { encodePayload, decodePayload } from '../src/lib/codec.ts';
import { assign } from '../src/lib/assign.ts';
import fs from 'node:fs';

const deckStr = fs.readFileSync(new URL('../src/data/deck-basic.json', import.meta.url), 'utf-8');
const deckBasic = JSON.parse(deckStr);

test('guest link hash decoding', () => {
  const guests = ['민서', '지호', '은우', '하린'];
  const assignments = assign(guests, deckBasic, 12345);
  
  const guestLinks = assignments.map(a => {
    const guestPayload = {
      n: a.name,
      m: a.mission
    };
    return encodePayload(guestPayload);
  });
  
  guestLinks.forEach(hash => {
    const decoded = decodePayload(hash);
    
    // Contains guest's name and mission
    assert.ok(decoded.n);
    assert.ok(decoded.m);
    assert.ok(decoded.m.id);
    assert.ok(decoded.m.text);
    
    // Contains NO partner name, partner mission, or link text
    const str = JSON.stringify(decoded);
    assert.ok(!str.includes('partner'));
    assert.ok(!str.includes('pairId') || str.includes('pairId') === false); // Just making sure
    assert.ok(!str.includes('link'));
    
    // Check that we didn't accidentally leak other guests
    const otherGuests = guests.filter(g => g !== decoded.n);
    for (const other of otherGuests) {
      assert.ok(!str.includes(other), `Should not contain partner name ${other}`);
    }
  });
});
