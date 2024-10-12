import { Libp2p, Stream } from '@libp2p/interface';

import {
  bulkhead,
  ExponentialBackoff,
  handleAll,
  isBrokenCircuitError,
  isTaskCancelledError,
  retry,
  timeout,
  TimeoutStrategy,
  wrap,
} from 'cockatiel';
import first from 'it-first';
import map from 'it-map';
import { pipe } from 'it-pipe';

import RoseNetNodeContext from '../context/RoseNetNodeContext';
import streamService from '../stream/stream-service';
import { encode } from '../utils/codec';

import RoseNetDirectError, {
  RoseNetDirectErrorType,
} from '../errors/RoseNetDirectError';
import RoseNetNodeError from '../errors/RoseNetNodeError';

import {
  ACK_BYTE,
  FAIL_FAST_MESSAGE_RETRY_ATTEMPTS,
  FAIL_FAST_MESSAGE_RETRY_INITIAL_DELAY,
  FAIL_FAST_THRESHOLD,
  MAX_OUTBOUND_ROSENET_DIRECT_QUEUE_SIZE,
  MAX_OUTBOUND_ROSENET_DIRECT_THROUGHPUT,
  MESSAGE_RETRY_ATTEMPTS,
  MESSAGE_RETRY_INITIAL_DELAY,
  MESSAGE_ROUNDTRIP_TIMEOUT,
} from '../constants';

/**
 * A factory returning a function to send a message to a specific peer via
 * RoseNet direct protocol
 */
const sendMessageFactory =
  (node: Libp2p) => async (to: string, message: string) => {
    let stream: Stream | undefined;

    try {
      stream = await streamService.getRoseNetDirectStreamTo(to, node);

      const messageRoundTripTimeout = timeout(
        MESSAGE_ROUNDTRIP_TIMEOUT,
        TimeoutStrategy.Aggressive,
      );

      const messagePipe = pipe(
        [message],
        (source) => map(source, encode),
        stream,
        async (source) => first(source),
      );

      RoseNetNodeContext.logger.debug('Starting message sending process');
      const result = await messageRoundTripTimeout.execute(() => messagePipe);
      RoseNetNodeContext.logger.debug('Message sending process completed');

      if (result?.length !== 1) {
        RoseNetNodeContext.logger.debug('Invalid multi-chunk ack received');
        throw new RoseNetDirectError(
          `There are more than one chunk in the ack message`,
          RoseNetDirectErrorType.InvalidAckChunks,
        );
      }
      const ack = result?.subarray();
      if (ack.length !== 1 || ack[0] !== ACK_BYTE) {
        RoseNetNodeContext.logger.debug('Invalid ack byte received');
        throw new RoseNetDirectError(
          `Ack byte is invalid`,
          RoseNetDirectErrorType.InvalidAckByte,
        );
      }
      RoseNetNodeContext.logger.debug('Ack validation compeleted');

      RoseNetNodeContext.logger.debug('Message sent successfully', {
        message,
      });
    } catch (error) {
      if (isBrokenCircuitError(error)) {
        RoseNetNodeContext.logger.debug(
          'Message sending attempt failed due to a broken circuit',
        );
        /**
         * We were unable to dial, so `stream` is undefined and we don't need to
         * abort it
         */
        throw new RoseNetNodeError(
          `Cannot dial peer ${to} to send message`,
          undefined,
          error,
        );
      }
      if (isTaskCancelledError(error)) {
        RoseNetNodeContext.logger.debug(
          'Message sending attempt failed due to timeout',
        );
        const errorToThrow = new RoseNetDirectError(
          'Message sending timed out',
          RoseNetDirectErrorType.Timeout,
        );
        stream?.abort(errorToThrow);
        throw errorToThrow;
      }
      RoseNetNodeContext.logger.debug(
        'Message sending attempt failed for some reason',
      );
      if (error instanceof RoseNetNodeError) {
        stream?.abort(error);
        throw error;
      }
      const errorToThrow = new RoseNetNodeError(
        `An unknown error occured: ${error instanceof Error ? error.message : error}`,
      );
      stream?.abort(errorToThrow);
      throw error;
    }
  };

const bulkheadPolicy = bulkhead(
  MAX_OUTBOUND_ROSENET_DIRECT_THROUGHPUT,
  MAX_OUTBOUND_ROSENET_DIRECT_QUEUE_SIZE,
);

/**
 * A wrapper around `sendMessageFactory` for retrying failed messages
 */
const sendMessageWithRetryAndBulkheadFactory =
  (node: Libp2p) =>
  (
    to: string,
    message: string,
    /**
     * an optional callback that is called with an error if the message sending
     * fails after enough retrials, and with no arguments otherwise
     */
    onSettled?: (error?: Error) => Promise<void>,
  ) => {
    const sendMessageInner = sendMessageFactory(node);

    const shouldFailFast = bulkheadPolicy.executionSlots > FAIL_FAST_THRESHOLD;

    const maxAttempts = shouldFailFast
      ? MESSAGE_RETRY_ATTEMPTS
      : FAIL_FAST_MESSAGE_RETRY_ATTEMPTS;
    const initialDelay = shouldFailFast
      ? MESSAGE_RETRY_INITIAL_DELAY
      : FAIL_FAST_MESSAGE_RETRY_INITIAL_DELAY;

    const retryPolicy = retry(handleAll, {
      maxAttempts,
      backoff: new ExponentialBackoff({
        initialDelay,
      }),
    });
    retryPolicy.onFailure((data) => {
      RoseNetNodeContext.logger.debug('Message sending failed', {
        message,
        reason: data.reason,
      });
    });
    retryPolicy.onRetry((data) => {
      RoseNetNodeContext.logger.debug(
        `Retry sending message (attempt #${data.attempt}/${MESSAGE_RETRY_ATTEMPTS})`,
        {
          message,
        },
      );
    });

    const wrappedPolicy = wrap(bulkheadPolicy, retryPolicy);

    wrappedPolicy
      .execute(() => sendMessageInner(to, message))
      .then(() => onSettled?.())
      .catch((error) => {
        RoseNetNodeContext.logger.warn(
          'Message sending failed, dropping message',
          {
            lastOccurredError: error,
            isFailFastEnabled: shouldFailFast,
          },
        );
        RoseNetNodeContext.logger.debug('Message was: ', {
          message,
        });
        onSettled?.(new RoseNetNodeError('Message sending failed'));
      });
  };

export default sendMessageWithRetryAndBulkheadFactory;
