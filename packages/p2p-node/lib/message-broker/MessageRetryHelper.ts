import { random } from 'lodash-es';

import { AbstractLogger } from '@rosen-bridge/logger-interface';

import { objectToUint8Array, uint8ArrayToObject } from '../utils';

import { MessageBrokerOptions, WrappedMessage } from './types';
import { Message } from '../types';

class MessageRetryHelper {
  constructor(
    private options: MessageBrokerOptions,
    protected logger: AbstractLogger
  ) {}

  /**
   * wrap a message, adding retries to it and converting it to a byte array
   * @param message
   * @param retries
   */
  protected wrapMessage = (message: Message, retries: number) =>
    objectToUint8Array({ message, retries });

  /**
   * unwrap a wrapped message from a byte array
   * @param wrappedMessage
   */
  protected unwrapMessage = (wrappedMessage: Uint8Array): WrappedMessage =>
    uint8ArrayToObject(wrappedMessage);

  /**
   * get timeout for a retry round
   * @description the timeout grows exponentially as the round increases
   * @param retryRound
   */
  protected getTimeoutForRetryRound = (retryRound: number) =>
    1000 * random(0.8, 1.2) * this.options.exponentialFactor ** retryRound;

  /**
   * schedule a message retry, which simply means adding the message to the
   * queue after a time
   * @param message
   * @param round
   * @param enqueue
   */
  protected scheduleMessageRetry = (
    message: Message,
    round: number,
    enqueue: (wrappedMessage: Uint8Array) => void
  ) => {
    const timeout = this.getTimeoutForRetryRound(round);

    setTimeout(() => {
      const newWrappedMessage = this.wrapMessage(message, round);
      enqueue(newWrappedMessage);
      this.logger.debug(
        `retry #${round} for sending failed message, message enqueued`,
        { message }
      );
    }, timeout);

    return timeout;
  };

  /**
   * try to retry routing a message if tried less than maxRetries
   * @param wrappedMessage
   * @param enqueue
   */
  protected retryRouting = (
    wrappedMessage: Uint8Array,
    enqueue: (wrappedMessage: Uint8Array) => void
  ) => {
    const { retries, message } = this.unwrapMessage(wrappedMessage);
    const currentRetryRound = Number(retries) + 1;

    if (currentRetryRound <= this.options.maxRetries) {
      const timeout = this.scheduleMessageRetry(
        message,
        currentRetryRound,
        enqueue
      );
      this.logger.debug(
        `message retry#${currentRetryRound} scheduled, retrying in ${timeout}ms`,
        {
          message,
        }
      );
    } else {
      this.logger.warn(
        `failed to send a message after ${this.options.maxRetries} retries, message dropped`
      );
      this.logger.warn(
        'this is mostly caused as a result of connection issues between current and target nodes'
      );
      this.logger.debug(`dropped message:`, {
        message,
      });
    }
  };
}

export default MessageRetryHelper;
