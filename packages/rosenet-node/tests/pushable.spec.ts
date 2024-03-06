import { it, describe, expect } from 'vitest';

import createPushable, { Pushable } from '../lib/pushable';

/**
 * delegate to the pushable parameter, essentially returning an iterator from
 * the pushable
 */
async function* delegateTo(pushable: Pushable<number>) {
  yield* pushable;
}

describe('createPushable', () => {
  /**
   * @target
   * createPushable should create a pushable
   *
   * @dependencies
   *
   * @scenario
   * - create pushable
   * - get an iterator from the pushable
   * - try to get next value from the iterator
   * - push a value into pushable
   * @expected
   * - the pushed value should be yielded
   */
  it('should create a pushable', async () => {
    const pushable = createPushable<number>();
    const iterator = delegateTo(pushable);

    const resultPromise = iterator.next();
    pushable.push(1);

    const { value } = await resultPromise;
    expect(value).toEqual(1);
  });
});
