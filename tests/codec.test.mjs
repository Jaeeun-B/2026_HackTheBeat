import test from 'node:test';
import assert from 'node:assert';
import { encodePayload, decodePayload } from '../src/lib/codec.ts';

test('codec coverage', () => {
  const obj = { text: '안녕하세요 한국어 테스트입니다.', id: 123 };
  const str = encodePayload(obj);
  
  assert.strictEqual(typeof str, 'string', 'Should return string');
  assert.deepStrictEqual(decodePayload(str), obj, 'Round trip should work with Korean text');
  
  assert.strictEqual(decodePayload(''), null, 'Empty string should return null');
  assert.strictEqual(decodePayload('   '), null, 'Whitespace string should return null (if not decodable) or fail gracefully');
  
  assert.strictEqual(decodePayload('invalid_string_without_base64!!!'), null, 'Corrupted string should return null without throwing');
});
