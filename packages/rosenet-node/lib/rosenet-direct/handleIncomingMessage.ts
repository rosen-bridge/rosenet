import {
  bulkhead,
  BulkheadPolicy,
  BulkheadRejectedError,
  wrap,
  timeout,
  TimeoutStrategy,
} from 'cockatiel';
import { pipe } from 'it-pipe';

import { Libp2p } from '@libp2p/interface';

import RoseNetNodeContext from '../context/RoseNetNodeContext';

import { decode } from '../utils/codec';

import {
  ACK_BYTE,
  MAX_INBOUND_ROSENET_DIRECT_QUEUE_SIZE,
  MAX_INBOUND_ROSENET_DIRECT_QUEUE_SIZE_PER_PEER,
  MAX_INBOUND_ROSENET_DIRECT_THROUGHPUT,
  MAX_INBOUND_ROSENET_DIRECT_THROUGHPUT_PER_PEER,
  ROSENET_DIRECT_PROTOCOL_V1,
  MESSAGE_HANDLING_TIMEOUT,
} from '../constants';

const messageHandlingBulkhead = bulkhead(
  MAX_INBOUND_ROSENET_DIRECT_THROUGHPUT,
  MAX_INBOUND_ROSENET_DIRECT_QUEUE_SIZE,
);
const peerBulkheads = new Proxy<Record<string, BulkheadPolicy>>(
  {},
  {
    get(bulkheads, peer: string) {
      if (peer in bulkheads) return bulkheads[peer];
      bulkheads[peer] = bulkhead(
        MAX_INBOUND_ROSENET_DIRECT_THROUGHPUT_PER_PEER,
        MAX_INBOUND_ROSENET_DIRECT_QUEUE_SIZE_PER_PEER,
      );
      return bulkheads[peer];
    },
  },
);

/**
 * protocol handler for RoseNet direct
 */
const handleIncomingMessageFactory =
  (node: Libp2p) => (handler: (from: string, message?: string) => void) => {
    node.handle(
      ROSENET_DIRECT_PROTOCOL_V1,
      async ({ connection, stream }) => {
        RoseNetNodeContext.logger.debug(
          `Incoming connection stream with protocol ${ROSENET_DIRECT_PROTOCOL_V1}`,
          {
            remoteAddress: connection.remoteAddr.toString(),
            transient: connection.transient,
          },
        );
        const wrappedPolicy = wrap(
          messageHandlingBulkhead,
          peerBulkheads[connection.remotePeer.toString()],
        );
        try {
          await wrappedPolicy.execute(async () => {
            try {
              const messageHandlingTimeout = timeout(
                MESSAGE_HANDLING_TIMEOUT,
                TimeoutStrategy.Aggressive,
              );
              await messageHandlingTimeout.execute(() =>
                pipe(
                  stream,
                  decode,
                  async function* (source) {
                    for await (const message of source) {
                      RoseNetNodeContext.logger.debug('Message decoded', {
                        message,
                      });
                      handler(connection.remotePeer.toString(), message);
                      RoseNetNodeContext.logger.debug('Handler called');
                      yield Uint8Array.of(ACK_BYTE);
                      RoseNetNodeContext.logger.debug(
                        'Ack sent back to the sender',
                      );
                    }
                  },
                  stream,
                ),
              );
              RoseNetNodeContext.logger.debug(
                'Incoming message handling completed',
              );
            } catch (error) {
              RoseNetNodeContext.logger.warn(
                'An error occurred while handling incoming message',
                {
                  error,
                },
              );
            }
          });
        } catch (error) {
          RoseNetNodeContext.logger.warn(
            'Maximum message handling threshold reached',
          );
          stream.abort(error as BulkheadRejectedError);
        }
      },
      { runOnTransientConnection: true },
    );
    RoseNetNodeContext.logger.info(
      `Handler for ${ROSENET_DIRECT_PROTOCOL_V1} protocol set`,
    );
  };

export default handleIncomingMessageFactory;
