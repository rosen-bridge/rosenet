import first from 'it-first';
import { Uint8ArrayList } from 'uint8arraylist';
import { describe, expect, it } from 'vitest';

import { decode, encode } from '../../lib/utils/codec';

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
   * decode should decode a byte array iterable into a string iterable
   *
   * @dependencies
   *
   * @scenario
   * - decode the byte array iterable consisting of a length prefix and message
   *   byte array
   * @expected
   * - first chunk of string iterable should be the message
   */
  it('should decode a byte array iterable into a string iterable', async () => {
    const actual = decode([
      Uint8ArrayList.fromUint8Arrays([lengthPrefixByteArray, messageByteArray]),
    ]);
    expect(await first(actual)).toEqual(message);
  });
});
