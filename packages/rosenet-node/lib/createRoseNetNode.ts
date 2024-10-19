import { gossipsub } from '@chainsafe/libp2p-gossipsub';
import { noise } from '@chainsafe/libp2p-noise';
import { yamux } from '@chainsafe/libp2p-yamux';
import { bootstrap } from '@libp2p/bootstrap';
import { circuitRelayTransport } from '@libp2p/circuit-relay-v2';
import { dcutr } from '@libp2p/dcutr';
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
import { publishFactory, subscribeFactory } from './rosenet-pubsub';

import RoseNetNodeContext from './context/RoseNetNodeContext';

import restartRelayDiscovery from './libp2p/restart-relay-discovery';

import addressService from './address/address-service';

import sample from './utils/sample';

import RoseNetNodeError from './errors/RoseNetNodeError';

import packageJson from '../package.json' with { type: 'json' };

import { PartialRoseNetNodeConfig } from './types';

const createRoseNetNode = async (config: PartialRoseNetNodeConfig) => {
  RoseNetNodeContext.init(config);
  RoseNetNodeContext.logger.debug('RoseNet node config got prepared', {
    config: {
      direct: RoseNetNodeContext.config.direct,
      pubsub: RoseNetNodeContext.config.pubsub,
      host: RoseNetNodeContext.config.host,
      port: RoseNetNodeContext.config.port,
      relay: RoseNetNodeContext.config.relay,
      whitelist: RoseNetNodeContext.config.whitelist,
      debug: RoseNetNodeContext.config.debug,
    },
  });

  if (!RoseNetNodeContext.config.relay.multiaddrs.length) {
    throw new RoseNetNodeError('Cannot start a RoseNet node without a relay');
  }

  /**
   * return if a peer is unauthorized, i.e. not whitelisted
   * @param peerId
   */
  const isPeerUnauthorized = (peerId: PeerId) =>
    !peerId || !RoseNetNodeContext.config.whitelist.includes(peerId.toString());

  const peerId = await privateKeyToPeerId(RoseNetNodeContext.config.privateKey);

  RoseNetNodeContext.logger.debug(`PeerId ${peerId.toString()} generated`);

  const announceMultiaddr = await addressService.getAnnounceMultiaddr(
    RoseNetNodeContext.config.port,
  );
  RoseNetNodeContext.logger.info(
    `${announceMultiaddr} set as announce multiaddr`,
  );

  const sampledRelayMultiaddrs = sample(
    RoseNetNodeContext.config.relay.multiaddrs,
    RoseNetNodeContext.config.relay.sampleSize,
  );

  const node = await createLibp2p({
    peerId,
    transports: [
      circuitRelayTransport({
        discoverRelays: RoseNetNodeContext.config.relay.sampleSize,
      }),
      tcp(),
    ],
    addresses: {
      listen: [
        `/ip4/${RoseNetNodeContext.config.host}/tcp/${RoseNetNodeContext.config.port}`,
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
      ...(RoseNetNodeContext.config.whitelist.length && {
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
        maxInboundDataLength:
          RoseNetNodeContext.config.pubsub.gossipsubMaxInboundDataLength,
        globalSignaturePolicy: 'StrictNoSign',
        ignoreDuplicatePublishError: true,
      }),
      dcutr: dcutr(),
      restartRelayDiscovery,
    },
    logger: libp2pLoggerFactory(
      RoseNetNodeContext.logger,
      RoseNetNodeContext.config.debug.libp2pComponents,
    ),
  });
  RoseNetNodeContext.logger.info('RoseNet node created');

  addEventListeners(node, RoseNetNodeContext.logger);

  return {
    start: async () => node.start(),
    sendMessage: sendMessageFactory(node),
    handleIncomingMessage: handleIncomingMessageFactory(node),
    publish: publishFactory(node),
    subscribe: subscribeFactory(node),
    info: {
      getPeerId: () => node.peerId.toString(),
      getConnectedPeers: () => node.getPeers().map((peer) => peer.toString()),
    },
  };
};

export default createRoseNetNode;
