import { gossipsub } from '@chainsafe/libp2p-gossipsub';
import { noise } from '@chainsafe/libp2p-noise';
import { bootstrap } from '@libp2p/bootstrap';
import { circuitRelayTransport } from '@libp2p/circuit-relay-v2';
import { identify } from '@libp2p/identify';
import { PeerId } from '@libp2p/interface';
import { mplex } from '@libp2p/mplex';
import { peerIdFromString } from '@libp2p/peer-id';
import { pubsubPeerDiscovery } from '@libp2p/pubsub-peer-discovery';
import { tcp } from '@libp2p/tcp';
import { pipe } from 'it-pipe';
import { createLibp2p } from 'libp2p';

import {
  addEventListeners,
  privateKeyToPeerId,
} from '@rosen-bridge/rosenet-utils';

import { decode, encode } from './codec';

import RoseNetNodeError from './errors/RoseNetNodeError';

import {
  RELAYS_COUNT_TO_CONNECT,
  ROSENET_DIRECT_PROTOCOL_V1,
} from './constants';

import packageJson from '../package.json' with { type: 'json' };

import { RoseNetNodeConfig } from './types';

const createRoseNetNode = async ({ logger, ...config }: RoseNetNodeConfig) => {
  if (!config.relayMultiaddrs.length) {
    throw new RoseNetNodeError('Cannot start a RoseNet node without a relay');
  }

  /**
   * return if a peer is unauthorized, i.e. not whitelisted
   * @param peerId
   */
  const isPeerUnauthorized = (peerId: PeerId) =>
    !peerId || !config.whitelist!.includes(peerId.toString());

  const peerId = await privateKeyToPeerId(config.privateKey);

  logger.debug(`PeerId ${peerId.toString()} generated`);

  const node = await createLibp2p({
    peerId,
    transports: [
      circuitRelayTransport({
        discoverRelays: RELAYS_COUNT_TO_CONNECT,
      }),
      tcp(),
    ],
    connectionEncryption: [noise()],
    connectionGater: {
      ...(config.whitelist && {
        denyInboundEncryptedConnection: isPeerUnauthorized,
        denyInboundRelayedConnection: (
          relayPeerId: PeerId,
          remotePeerId: PeerId,
        ) =>
          isPeerUnauthorized(relayPeerId) || isPeerUnauthorized(remotePeerId),
        denyDialPeer: isPeerUnauthorized,
      }),
    },
    streamMuxers: [mplex()],
    peerDiscovery: [
      bootstrap({
        list: config.relayMultiaddrs,
      }),
      pubsubPeerDiscovery(),
    ],
    nodeInfo: {
      name: 'rosenet-node',
      version: packageJson.version,
    },
    services: {
      identify: identify(),
      pubsub: gossipsub({ allowPublishToZeroPeers: true }),
    },
  });
  logger.debug('RoseNet node created');

  addEventListeners(node, logger);

  return {
    start: async () => node.start(),
    sendMessage: async (to: string, message: string) => {
      const peerId = peerIdFromString(to);
      const stream = await node.dialProtocol(
        peerId,
        ROSENET_DIRECT_PROTOCOL_V1,
        {
          runOnTransientConnection: true,
        },
      );
      logger.debug('stream created for sending message', {
        stream: {
          direction: stream.direction,
          protocol: stream.protocol,
          remotePeer: to,
        },
      });
      await pipe(message, encode, stream);
      logger.debug('message piped through created stream', {
        message,
      });
    },
    handleIncomingMessage: (
      handler: (from: string, message?: string) => void,
    ) => {
      node.handle(
        ROSENET_DIRECT_PROTOCOL_V1,
        async ({ connection, stream }) => {
          logger.debug(
            `incoming connection stream with protocol ${ROSENET_DIRECT_PROTOCOL_V1}`,
            {
              remoteAddress: connection.remoteAddr.toString(),
              transient: connection.transient,
            },
          );
          pipe(stream, decode, async (messagePromise) => {
            const message = await messagePromise;
            await handler(connection.remotePeer.toString(), message);
            logger.debug('incoming message handled successfully', {
              message,
            });
          });
        },
        { runOnTransientConnection: true },
      );
      logger.debug(`handler for ${ROSENET_DIRECT_PROTOCOL_V1} protocol set`);
    },
  };
};

export default createRoseNetNode;
