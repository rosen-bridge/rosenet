import { peerIdFromString } from '@libp2p/peer-id';
import { shuffle } from 'fast-shuffle';
import { Libp2p } from 'libp2p';

import RoseNetNodeContext from '../context/RoseNetNodeContext';

import { ROSENET_DIRECT_PROTOCOL_V1 } from '../constants';

/**
 * get a new stream to the `to` remotePeer with ROSENET_DIRECT_PROTOCOL_V1
 * protocol
 *
 * @param to remotePeer
 * @param node
 */
async function getRoseNetDirectStreamTo(to: string, node: Libp2p) {
  const peerId = peerIdFromString(to);

  const allConnectionsToPeer = shuffle(node.getConnections(peerId));
  const possibleOpenConnectionToPeer = allConnectionsToPeer.find(
    (connection) => connection.status === 'open',
  );
  const connection = possibleOpenConnectionToPeer ?? (await node.dial(peerId));

  RoseNetNodeContext.logger.debug(
    possibleOpenConnectionToPeer
      ? `Found an open connection to peer ${to}`
      : `Established a new connection to peer ${to}`,
    {
      connection: {
        id: connection.id,
        transient: connection.transient,
      },
    },
  );

  const stream = await connection.newStream(ROSENET_DIRECT_PROTOCOL_V1, {
    runOnTransientConnection: true,
  });

  RoseNetNodeContext.logger.debug(`Created a new stream to peer ${to}`, {
    stream: {
      id: stream.id,
    },
  });

  return stream;
}

export default {
  getRoseNetDirectStreamTo,
};
