import first from 'it-first';
import * as lp from 'it-length-prefixed';
import map from 'it-map';
import { pipe } from 'it-pipe';
import { Source } from 'it-stream-types';
import { Uint8ArrayList } from 'uint8arraylist';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

/**
 * encode a string into a byte array iterable with length prefix
 * @param source
 */
const encode = (source: string) =>
  pipe(source, textEncoder.encode.bind(textEncoder), lp.encode.single);

/**
 * decode a byte array iterable with length prefix into a string promise
 * @param source
 */
const decode = (source: Source<Uint8ArrayList>) =>
  pipe(
    source,
    lp.decode,
    (source) => map(source, (message) => message.subarray()),
    (source) => map(source, textDecoder.decode.bind(textDecoder)),
    first<string>,
  );

export { decode, encode };
