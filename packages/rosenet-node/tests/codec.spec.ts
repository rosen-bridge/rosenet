import { Uint8ArrayList } from 'uint8arraylist';
import { describe, expect, it } from 'vitest';

import { decode, encode } from '../lib/codec';

const message = 'hello world';
const lengthPrefixByteArray = Uint8Array.from([message.length]);
const messageByteArray = Uint8Array.from([
  104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100,
]);

describe('encode', () => {
  /**
   * @target
   * encode should encode a message
   *
   * @dependencies
   *
   * @scenario
   * - encode the message
   * - check second chunk of returned iterable, omitting length prefix
   * @expected
   * - the chunk should be message byte array
   */
  it('should encode a message', () => {
    const actual = encode(message);
    const [, byteArray] = [...actual];
    expect(byteArray).toEqual(messageByteArray);
  });
});

describe('decode', () => {
  /**
   * @target
   * decode should decode a byte array iterable
   *
   * @dependencies
   *
   * @scenario
   * - decode the byte array iterable consisting of a length prefix and message
   *   byte array
   * - await returned promise
   * @expected
   * - decoded value should be message
   */
  it('should decode a byte array iterable', async () => {
    const actual = await decode([
      Uint8ArrayList.fromUint8Arrays([lengthPrefixByteArray, messageByteArray]),
    ]);
    expect(actual).toEqual(message);
  });
});
