import { pipe } from 'it-pipe';

import { Libp2p } from '@libp2p/interface';

import RoseNetNodeContext from '../context/RoseNetNodeContext';

import { decode } from '../utils/codec';

import { ACK_BYTE, ROSENET_DIRECT_PROTOCOL_V1 } from '../constants';

/**
 * protocol handler for RoseNet direct
 */
const handleIncomingMessageFactory =
  (node: Libp2p) => (handler: (from: string, message?: string) => void) => {
    node.handle(
      ROSENET_DIRECT_PROTOCOL_V1,
      async ({ connection, stream }) => {
        RoseNetNodeContext.logger.debug(
          `incoming connection stream with protocol ${ROSENET_DIRECT_PROTOCOL_V1}`,
          {
            remoteAddress: connection.remoteAddr.toString(),
            transient: connection.transient,
          },
        );
        try {
          await pipe(
            stream,
            decode,
            async function* (source) {
              for await (const message of source) {
                RoseNetNodeContext.logger.debug(
                  'message received, calling handler and sending ack',
                  {
                    message,
                  },
                );
                handler(connection.remotePeer.toString(), message);
                yield Uint8Array.of(ACK_BYTE);
              }
            },
            stream,
          );
        } catch (error) {
          RoseNetNodeContext.logger.warn(
            'An error occurred while reading from stream',
            {
              error,
            },
          );
        }
      },
      { runOnTransientConnection: true },
    );
    RoseNetNodeContext.logger.debug(
      `handler for ${ROSENET_DIRECT_PROTOCOL_V1} protocol set`,
    );
  };

export default handleIncomingMessageFactory;
