import { gossipsub } from '@chainsafe/libp2p-gossipsub';
import { noise } from '@chainsafe/libp2p-noise';
import { yamux } from '@chainsafe/libp2p-yamux';
import { bootstrap } from '@libp2p/bootstrap';
import { circuitRelayTransport } from '@libp2p/circuit-relay-v2';
import { identify } from '@libp2p/identify';
import { PeerId } from '@libp2p/interface';
import { pubsubPeerDiscovery } from '@libp2p/pubsub-peer-discovery';
import { tcp } from '@libp2p/tcp';

import { createLibp2p } from 'libp2p';

import {
  addEventListeners,
  libp2pLoggerFactory,
  privateKeyToPeerId,
} from '@rosen-bridge/rosenet-utils';

import {
  handleIncomingMessageFactory,
  sendMessageFactory,
} from './rosenet-direct';

import RoseNetNodeContext from './context/RoseNetNodeContext';

import restartRelayDiscovery from './libp2p/restart-relay-discovery';

import addressService from './address/address-service';

import sample from './utils/sample';

import RoseNetNodeError from './errors/RoseNetNodeError';

import { DEFAULT_NODE_PORT, RELAYS_COUNT_TO_CONNECT } from './constants';

import packageJson from '../package.json' with { type: 'json' };

import { RoseNetNodeConfig } from './types';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const createRoseNetNode = async ({
  logger,
  port = DEFAULT_NODE_PORT,
  ...config
}: RoseNetNodeConfig) => {
  if (!config.relayMultiaddrs.length) {
    throw new RoseNetNodeError('Cannot start a RoseNet node without a relay');
  }

  RoseNetNodeContext.init(logger);

  /**
   * return if a peer is unauthorized, i.e. not whitelisted
   * @param peerId
   */
  const isPeerUnauthorized = (peerId: PeerId) =>
    !peerId || !config.whitelist!.includes(peerId.toString());

  const peerId = await privateKeyToPeerId(config.privateKey);

  RoseNetNodeContext.logger.debug(`PeerId ${peerId.toString()} generated`);

  const announceMultiaddr = await addressService.getAnnounceMultiaddr(port);
  logger.info(`${announceMultiaddr} set as announce multiaddr`);

  const sampledRelayMultiaddrs = sample(
    config.relayMultiaddrs,
    RELAYS_COUNT_TO_CONNECT,
  );

  const node = await createLibp2p({
    peerId,
    transports: [
      circuitRelayTransport({
        discoverRelays: RELAYS_COUNT_TO_CONNECT,
      }),
      tcp(),
    ],
    addresses: {
      listen: [
        `/ip4/0.0.0.0/tcp/${port}`,
        ...sampledRelayMultiaddrs.map(
          (multiaddr) => `${multiaddr}/p2p-circuit`,
        ),
      ],
      announce: [
        announceMultiaddr,
        ...sampledRelayMultiaddrs.map(
          (multiaddr) => `${multiaddr}/p2p-circuit`,
        ),
      ],
    },
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
    streamMuxers: [yamux()],
    connectionManager: {
      minConnections: 0,
    },
    peerDiscovery: [
      bootstrap({
        list: sampledRelayMultiaddrs,
      }),
      pubsubPeerDiscovery(),
    ],
    nodeInfo: {
      name: 'rosenet-node',
      version: packageJson.version,
    },
    services: {
      identify: identify(),
      pubsub: gossipsub({
        allowPublishToZeroTopicPeers: true,
        /**
         * Current implementation of Gossipsub includes at most 5000 messages in
         * IHAVE or IWANT messages during a `mcachegossip` window, which is by
         * default 3 heartbeats. Supposing a limit of 100KB for each message, a
         * maximum of around 5000*100KB=500MB is received in 3 heartbeats from
         * a single stream, which is 500MB/3≃170MB.
         */
        maxInboundDataLength: 170_000_000, // 170MB
      }),
      restartRelayDiscovery,
    },
    logger: libp2pLoggerFactory(logger, config.debug?.libp2pComponents ?? []),
  });
  RoseNetNodeContext.logger.debug('RoseNet node created');

  addEventListeners(node, RoseNetNodeContext.logger);

  return {
    start: async () => node.start(),
    sendMessage: sendMessageFactory(node),
    handleIncomingMessage: handleIncomingMessageFactory(node),
    publish: async (topic: string, message: string) => {
      node.services.pubsub.publish(topic, textEncoder.encode(message));
    },
    subscribe: async (topic: string, handler: (message: string) => void) => {
      node.services.pubsub.subscribe(topic);
      node.services.pubsub.addEventListener('message', (event) => {
        if (event.detail.topic === topic) {
          handler(textDecoder.decode(event.detail.data));
        }
      });
    },
  };
};

export default createRoseNetNode;
