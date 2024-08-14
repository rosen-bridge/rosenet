import { gossipsub } from '@chainsafe/libp2p-gossipsub';
import { noise } from '@chainsafe/libp2p-noise';
import { circuitRelayServer } from '@libp2p/circuit-relay-v2';
import { identify } from '@libp2p/identify';
import { PeerId } from '@libp2p/interface';
import { yamux } from '@chainsafe/libp2p-yamux';
import { pubsubPeerDiscovery } from '@libp2p/pubsub-peer-discovery';
import { tcp } from '@libp2p/tcp';
import { createLibp2p } from 'libp2p';

import {
  addEventListeners,
  libp2pLoggerFactory,
  privateKeyToPeerId,
} from '@rosen-bridge/rosenet-utils';

import { RoseNetRelayError } from './errors';

import { DEFAULT_LISTEN_HOST } from './constants';

import packageJson from '../package.json' with { type: 'json' };

import { RoseNetRelayConfig } from './types';

const createRoseNetRelay = async ({
  logger,
  ...config
}: RoseNetRelayConfig) => {
  if (!config.whitelist.length) {
    throw new RoseNetRelayError(
      'Cannot start a RoseNet relay with no whitelisted peer id',
    );
  }

  /**
   * return if a peer is unauthorized, i.e. not whitelisted
   * @param peerId
   */
  const isPeerUnauthorized = (peerId: PeerId) =>
    !peerId || !config.whitelist.includes(peerId.toString());

  const peerId = await privateKeyToPeerId(config.privateKey);

  logger.debug(`PeerId ${peerId.toString()} generated`);

  const node = await createLibp2p({
    peerId,
    addresses: {
      listen: [
        `/ip4/${config.listen?.host ?? DEFAULT_LISTEN_HOST}/tcp/${config.listen?.port ?? '0'}`,
      ],
    },
    transports: [tcp()],
    connectionEncryption: [noise()],
    connectionGater: {
      denyInboundEncryptedConnection: isPeerUnauthorized,

      denyInboundRelayReservation: isPeerUnauthorized,
      /**
       * In RoseNet, there isn't a scenario in which a relay needs to accept
       * relayed connections
       */
      denyInboundRelayedConnection: () => true,
      denyDialPeer: isPeerUnauthorized,
    },
    streamMuxers: [yamux()],
    services: {
      circuitRelay: circuitRelayServer({
        reservations: {
          maxReservations: config.maxReservations,
          defaultDurationLimit: 0,
          defaultDataLimit: 0n,
          applyDefaultLimit: false,
        },
      }),
      pubsub: gossipsub({
        allowPublishToZeroPeers: true,
        runOnTransientConnection: true,
      }),
      identify: identify(),
    },
    peerDiscovery: [pubsubPeerDiscovery()],
    nodeInfo: {
      name: 'rosenet-relay',
      version: packageJson.version,
    },
    logger: libp2pLoggerFactory(logger, config.debug?.libp2pComponents ?? []),
  });

  logger.debug('RoseNet relay created');

  addEventListeners(node, logger, true);

  return {
    start: async () => node.start(),
  };
};

export default createRoseNetRelay;
