import { it, expect } from 'vitest';

import { objectToUint8Array, uint8ArrayToObject } from '../../lib/utils';

import { testData } from './utilsTestData';

it('should convert object to Uint8Array correctly', () => {
  const converted = objectToUint8Array(testData.object);

  expect(converted).toEqual(testData.byteArray);
});

it('should convert Uint8Array to object correctly', () => {
  const converted = uint8ArrayToObject(testData.byteArray);

  expect(converted).toEqual(testData.object);
});
