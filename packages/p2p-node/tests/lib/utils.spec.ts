import { describe, expect, it } from 'vitest';

import { objectToUint8Array, uint8ArrayToObject } from '../../lib/utils';

import { testData } from './utilsTestData';

describe('objectToUint8Array', () => {
  /**
   * @target
   * objectToUint8Array should convert object to Uint8Array correctly
   *
   * @dependencies
   *
   * @scenario
   * - call the function under test
   * @expected
   * - converted value should be the expected one
   */
  it('should convert object to Uint8Array correctly', () => {
    const converted = objectToUint8Array(testData.object);

    expect(converted).toEqual(testData.byteArray);
  });
});

describe('uint8ArrayToObject', () => {
  /**
   * @target
   * uint8ArrayToObject should convert Uint8Array to object correctly
   *
   * @dependencies
   *
   * @scenario
   * - call the function under test
   * @expected
   * - converted value should be the expected one
   */
  it('should convert Uint8Array to object correctly', () => {
    const converted = uint8ArrayToObject(testData.byteArray);

    expect(converted).toEqual(testData.object);
  });
});
