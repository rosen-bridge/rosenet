import { gossipsub } from '@chainsafe/libp2p-gossipsub';
import { noise } from '@chainsafe/libp2p-noise';
import { bootstrap } from '@libp2p/bootstrap';
import { circuitRelayTransport } from '@libp2p/circuit-relay-v2';
import { identify } from '@libp2p/identify';
import { PeerId } from '@libp2p/interface';
import { yamux } from '@chainsafe/libp2p-yamux';
import { pubsubPeerDiscovery } from '@libp2p/pubsub-peer-discovery';
import { tcp } from '@libp2p/tcp';
import map from 'it-map';
import { pipe } from 'it-pipe';
import { createLibp2p } from 'libp2p';

import {
  addEventListeners,
  libp2pLoggerFactory,
  privateKeyToPeerId,
} from '@rosen-bridge/rosenet-utils';

import RoseNetNodeContext from './context/RoseNetNodeContext';

import addressService from './address/address-service';
import streamService from './stream/stream-service';

import { decode, encode } from './utils/codec';

import RoseNetNodeError from './errors/RoseNetNodeError';

import {
  DEFAULT_NODE_PORT,
  RELAYS_COUNT_TO_CONNECT,
  ROSENET_DIRECT_PROTOCOL_V1,
} from './constants';

import packageJson from '../package.json' with { type: 'json' };

import { RoseNetNodeConfig } from './types';

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
        ...config.relayMultiaddrs.map(
          (multiaddr) => `${multiaddr}/p2p-circuit`,
        ),
      ],
      announce: [
        announceMultiaddr,
        ...config.relayMultiaddrs.map(
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
      pubsub: gossipsub({
        allowPublishToZeroPeers: true,
        runOnTransientConnection: true,
      }),
    },
    logger: libp2pLoggerFactory(logger, config.debug?.libp2pComponents ?? []),
  });
  RoseNetNodeContext.logger.debug('RoseNet node created');

  addEventListeners(node, RoseNetNodeContext.logger);

  return {
    start: async () => node.start(),
    sendMessage: async (to: string, message: string) => {
      const { stream, pushable } = await streamService.getStreamAndPushable(
        to,
        node,
      );

      pipe(pushable, (source) => map(source, encode), stream);
      pushable.push(message);
      await Promise.resolve();

      RoseNetNodeContext.logger.debug('message piped through created stream', {
        message,
      });
    },
    handleIncomingMessage: (
      handler: (from: string, message?: string) => void,
    ) => {
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
          pipe(stream, decode, async (source) => {
            for await (const message of source) {
              await handler(connection.remotePeer.toString(), message);
              RoseNetNodeContext.logger.debug(
                'incoming message handled successfully',
                {
                  message,
                },
              );
            }
          });
        },
        { runOnTransientConnection: true },
      );
      RoseNetNodeContext.logger.debug(
        `handler for ${ROSENET_DIRECT_PROTOCOL_V1} protocol set`,
      );
    },
    publish: async (topic: string, message: string) => {
      const textEncoder = new TextEncoder();
      node.services.pubsub.publish(topic, textEncoder.encode(message));
    },
    subscribe: async (topic: string, handler: (message: string) => void) => {
      node.services.pubsub.subscribe(topic);
      node.services.pubsub.addEventListener('message', (event) => {
        if (event.detail.topic === topic) {
          const textDecoder = new TextDecoder();
          handler(textDecoder.decode(event.detail.data));
        }
      });
    },
  };
};

export default createRoseNetNode;
