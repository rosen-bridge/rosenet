import { gossipsub } from '@chainsafe/libp2p-gossipsub';
import { noise } from '@chainsafe/libp2p-noise';
import { bootstrap } from '@libp2p/bootstrap';
import { circuitRelayTransport } from '@libp2p/circuit-relay-v2';
import { identify } from '@libp2p/identify';
import { PeerId } from '@libp2p/interface';
import { mplex } from '@libp2p/mplex';
import { pubsubPeerDiscovery } from '@libp2p/pubsub-peer-discovery';
import { tcp } from '@libp2p/tcp';
import { createLibp2p } from 'libp2p';

import {
  addEventListeners,
  privateKeyToPeerId,
} from '@rosen-bridge/rosenet-utils';

import RoseNetNodeError from './errors/RoseNetNodeError';

import { RELAYS_COUNT_TO_CONNECT } from './constants';

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
  };
};

export default createRoseNetNode;
