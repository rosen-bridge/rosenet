import { describe, expect, it, vi, vitest } from 'vitest';

import { DummyLogger } from '@rosen-bridge/logger-interface';

import MessageBroker from '../../../lib/message-broker/MessageBroker';

/**
 * generate fake messages on demand
 */
function* messageGenerator() {
  const counter = 0;
  while (true) {
    yield {
      channel: 'somechannel',
      data: `hello ${counter}`,
      peerId: counter.toString(),
    };
  }
}

/**
 * create a fixture for testing message broker
 */
const createFixture = () => {
  const maxRetries = 3;
  const messageBroker = new MessageBroker(
    {
      exponentialFactor: 3,
      maxRetries,
    },
    new DummyLogger(),
  );

  const messagesIterator = messageGenerator();

  return { messagesIterator, messageBroker, maxRetries };
};

describe('MessageBroker', () => {
  /**
   * @target
   * MessageBroker should broker messages correctly
   *
   * @dependencies
   *
   * @scenario
   * - instantiate MessageBroker
   * - start routing with a mocked route
   * - enqueue two messages
   * @expected
   * the enqueued messages should be routed
   */
  it('should broker messages correctly', async () => {
    const {
      messageBroker,
      messagesIterator: [message1, message2],
    } = createFixture();

    const route = vitest.fn();
    messageBroker.startRouting(route);

    messageBroker.enqueue(message1);
    messageBroker.enqueue(message2);

    await vi.waitFor(() => {
      expect(route).toHaveBeenCalledWith(message1);
      expect(route).toHaveBeenCalledWith(message2);
    });
  });

  /**
   * @target
   * MessageBroker should retry failed messages
   *
   * @dependencies
   *
   * @scenario
   * - mock timers
   * - instantiate MessageBroker
   * - mock the passed route to reject for the first call
   * - mock the passed route to call a spy on subsequent calls
   * - start routing with the mocked route
   * - enqueue a message
   * - wait for the mocked route to be called once
   * - run next set timeout
   * @expected
   * - the spy should be called
   * - the mocked route should be called only twice
   */
  it('should retry failed messages', async () => {
    vi.useFakeTimers();
    const {
      messageBroker,
      messagesIterator: [message],
    } = createFixture();

    const spy = vitest.fn();
    const route = vitest
      .fn()
      .mockRejectedValueOnce(new Error())
      .mockImplementation((message) => {
        spy(message);
      });

    messageBroker.startRouting(route);

    messageBroker.enqueue(message);

    await vi.waitFor(() => {
      expect(route).toHaveBeenCalledTimes(1);
    });

    vi.advanceTimersToNextTimer();

    await vi.waitFor(() => {
      expect(spy).toHaveBeenCalledWith(message);
      expect(route).toHaveBeenCalledTimes(2);
    });
  });

  /**
   * @target
   * MessageBroker should not retry failed messages forever
   *
   * @dependencies
   *
   * @scenario
   * - mock timers
   * - instantiate MessageBroker
   * - mock the passed route to always reject
   * - start routing with the mocked route
   * - enqueue a message
   * - wait for the mocked route to be called for n times, where n equals
   *  maxRetries
   * @expected
   * - the mocked route should not be called more than that
   */
  it('should not retry failed messages forever', async () => {
    vi.useFakeTimers();
    const {
      messageBroker,
      messagesIterator: [message],
      maxRetries,
    } = createFixture();

    const route = vitest.fn().mockRejectedValue(new Error());

    messageBroker.startRouting(route);

    messageBroker.enqueue(message);

    for (let i = 0; i <= maxRetries; i++) {
      await vi.waitFor(() => {
        expect(route).toHaveBeenCalledTimes(i + 1);
        vi.advanceTimersToNextTimer();
      });
    }

    expect(() =>
      vi.waitFor(() => {
        expect(route).toHaveBeenCalledTimes(5);
      }),
    ).rejects.toThrow();
  });
});
