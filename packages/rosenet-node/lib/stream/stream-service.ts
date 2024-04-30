import { Stream } from '@libp2p/interface';
import { peerIdFromString } from '@libp2p/peer-id';
import { shuffle } from 'fast-shuffle';
import { Libp2p } from 'libp2p';

import RoseNetNodeContext from '../context/RoseNetNodeContext';
import createPushable, { Pushable } from './createPushable';

import { ROSENET_DIRECT_PROTOCOL_V1 } from '../constants';

const cache = new Map<
  string,
  {
    stream: Stream;
    pushable: Pushable<string>;
  }
>();

/**
 * return if a stream can be written on
 * @param stream
 */
const isStreamWritable = (stream: Stream) =>
  ['ready', 'writing'].includes(stream.writeStatus);

/**
 * get a stream and a pushable to the `to` remotePeer with
 * ROSENET_DIRECT_PROTOCOL_V1 protocol, caching the pair for future use
 *
 * @param to remotePeer
 * @param node
 */
async function getStreamAndPushable(to: string, node: Libp2p) {
  const cacheHit = cache.get(to);
  if (cacheHit && isStreamWritable(cacheHit.stream)) {
    RoseNetNodeContext.logger.debug(
      `Found existing stream and pushable in the cache to peer ${to}`,
      {
        stream: {
          direction: cacheHit.stream.direction,
          protocol: cacheHit.stream.protocol,
          remotePeer: to,
          id: cacheHit.stream.id,
        },
      },
    );
    return cacheHit;
  }

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

  const connectionStream = shuffle(connection.streams);
  const possibleWritableStream = connectionStream.find(
    (stream) =>
      isStreamWritable(stream) &&
      stream.direction === 'outbound' &&
      stream.protocol === ROSENET_DIRECT_PROTOCOL_V1,
  );
  const stream =
    possibleWritableStream ??
    (await connection.newStream(ROSENET_DIRECT_PROTOCOL_V1, {
      runOnTransientConnection: true,
    }));

  RoseNetNodeContext.logger.debug(
    possibleWritableStream
      ? `Found an open stream to peer ${to}`
      : `Created a new stream to peer ${to}`,
    {
      stream: {
        direction: stream.direction,
        protocol: stream.protocol,
        remotePeer: to,
        id: stream.id,
      },
    },
  );

  const pushable = createPushable<string>();

  const pair = {
    stream,
    pushable,
  };

  cache.set(to, pair);

  return pair;
}

export default {
  getStreamAndPushable,
};
