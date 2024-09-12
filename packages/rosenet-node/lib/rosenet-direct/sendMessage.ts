import { Libp2p } from '@libp2p/interface';

import { ExponentialBackoff, handleAll, retry } from 'cockatiel';
import first from 'it-first';
import map from 'it-map';
import { pipe } from 'it-pipe';
import { AbortError, raceSignal } from 'race-signal';

import RoseNetNodeContext from '../context/RoseNetNodeContext';
import streamService from '../stream/stream-service';
import { encode } from '../utils/codec';

import RoseNetDirectAckError, {
  AckError,
} from '../errors/RoseNetDirectAckError';
import RoseNetNodeError from '../errors/RoseNetNodeError';

import {
  ACK_BYTE,
  ACK_TIMEOUT,
  MESSAGE_RETRY_ATTEMPTS,
  MESSAGE_RETRY_EXPONENT,
  MESSAGE_RETRY_INITIAL_DELAY,
} from '../constants';

/**
 * A factory returning a function to send a message to a specific peer via
 * RoseNet direct protocol
 */
const sendMessageFactory =
  (node: Libp2p) => async (to: string, message: string) => {
    let stream;

    try {
      stream = await streamService.getRoseNetDirectStreamTo(to, node);

      const result = await pipe(
        [message],
        (source) => map(source, encode),
        stream,
        async (source) =>
          await raceSignal(first(source), AbortSignal.timeout(ACK_TIMEOUT)),
      );

      if (result?.length !== 1) {
        throw new RoseNetDirectAckError(
          `There are more than one chunk in the ack message`,
          AckError.InvalidChunks,
        );
      }
      const ack = result?.subarray();
      if (ack.length !== 1 || ack[0] !== ACK_BYTE) {
        throw new RoseNetDirectAckError(
          `Ack byte is invalid`,
          AckError.InvalidByte,
        );
      }

      RoseNetNodeContext.logger.debug('message sent successfully', {
        message,
      });
    } catch (error) {
      if (error instanceof AbortError) {
        const errorToThrow = new RoseNetDirectAckError(
          `Ack was not received`,
          AckError.Timeout,
        );
        stream?.abort(errorToThrow);
        throw errorToThrow;
      }
      if (error instanceof RoseNetDirectAckError) {
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

/**
 * A wrapper around `sendMessageFactory` for retrying failed messages
 */
const sendMessageWithRetryFactory =
  (node: Libp2p) =>
  async (
    to: string,
    message: string,
    /**
     * an optional callback that is called with an error if the message sending
     * fails after enough retrials, and with no arguments otherwise
     */
    onSettled?: (error?: Error) => Promise<void>,
  ) => {
    const sendMessageInner = sendMessageFactory(node);
    try {
      const retryPolicy = retry(handleAll, {
        maxAttempts: MESSAGE_RETRY_ATTEMPTS,
        backoff: new ExponentialBackoff({
          exponent: MESSAGE_RETRY_EXPONENT,
          initialDelay: MESSAGE_RETRY_INITIAL_DELAY,
          maxDelay: 300_000,
        }),
      });
      retryPolicy.onFailure((data) => {
        RoseNetNodeContext.logger.debug('message sending failed', {
          message,
          reason: data.reason,
        });
      });
      retryPolicy.onRetry((data) => {
        RoseNetNodeContext.logger.debug(
          `retry sending message (attempt #${data.attempt}/${MESSAGE_RETRY_ATTEMPTS})`,
          {
            message,
          },
        );
      });

      await retryPolicy.execute(() => sendMessageInner(to, message));
      onSettled?.();
    } catch (error) {
      RoseNetNodeContext.logger.error(
        'message sending failed regardless of 3 retries, dropping message',
      );
      RoseNetNodeContext.logger.debug('message was: ', {
        message,
      });
      onSettled?.(new RoseNetNodeError('Message sending failed'));
    }
  };

export default sendMessageWithRetryFactory;
