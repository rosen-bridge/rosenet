import {
  fromString as uint8ArrayFromString,
  toString as uint8ArrayToString,
} from 'uint8arrays';

import JsonBigInt from '@rosen-bridge/json-bigint';

/**
 * Converts an object to Uint8Array
 * @param object
 */
export const objectToUint8Array = (object: unknown) =>
  uint8ArrayFromString(JsonBigInt.stringify(object));

/**
 * Converts a Unit8Array to an object
 * @param uint8Array
 */
export const uint8ArrayToObject = (uint8Array: Uint8Array) =>
  JsonBigInt.parse(uint8ArrayToString(uint8Array));
