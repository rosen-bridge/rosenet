import { gossipsub } from '@chainsafe/libp2p-gossipsub';
import { noise } from '@chainsafe/libp2p-noise';
import { yamux } from '@chainsafe/libp2p-yamux';
import { bootstrap } from '@libp2p/bootstrap';
import { circuitRelayTransport } from '@libp2p/circuit-relay-v2';
import { identify } from '@libp2p/identify';
import { PeerId } from '@libp2p/interface';
import { pubsubPeerDiscovery } from '@libp2p/pubsub-peer-discovery';
import { tcp } from '@libp2p/tcp';
import { AbortError, raceSignal } from 'race-signal';

import first from 'it-first';
import map from 'it-map';
import { pipe } from 'it-pipe';
import { createLibp2p } from 'libp2p';

import {
  addEventListeners,
  libp2pLoggerFactory,
  privateKeyToPeerId,
} from '@rosen-bridge/rosenet-utils';

import RoseNetNodeContext from './context/RoseNetNodeContext';

import restartRelayDiscovery from './libp2p/restart-relay-discovery';

import addressService from './address/address-service';
import streamService from './stream/stream-service';

import { decode, encode } from './utils/codec';
import sample from './utils/sample';

import RoseNetNodeError from './errors/RoseNetNodeError';
import RoseNetDirectAckError, {
  AckError,
} from './errors/RoseNetDirectAckError';

import {
  ACK_BYTE,
  ACK_TIMEOUT,
  DEFAULT_NODE_PORT,
  RELAYS_COUNT_TO_CONNECT,
  ROSENET_DIRECT_PROTOCOL_V1,
} from './constants';

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
    sendMessage: async (to: string, message: string) => {
      let stream;

      try {
        stream = await streamService.getRoseNetDirectStreamTo(to, node);

        const result = await pipe(
          [message],
          (source) => map(source, encode),
          stream,
          async (source) =>
            await raceSignal(first(source), AbortSignal.timeout(ACK_TIMEOUT)),
        );

        if (result?.length !== 1) {
          throw new RoseNetDirectAckError(
            `There are more than one chunk in the ack message`,
            AckError.InvalidChunks,
          );
        }
        const ack = result?.subarray();
        if (ack.length !== 1 || ack[0] !== ACK_BYTE) {
          throw new RoseNetDirectAckError(
            `Ack byte is invalid`,
            AckError.InvalidByte,
          );
        }

        RoseNetNodeContext.logger.debug('message sent successfully', {
          message,
        });
      } catch (error) {
        if (error instanceof AbortError) {
          const errorToThrow = new RoseNetDirectAckError(
            `Ack was not received`,
            AckError.Timeout,
          );
          stream?.abort(errorToThrow);
          throw errorToThrow;
        }
        if (error instanceof RoseNetDirectAckError) {
          stream?.abort(error);
          throw error;
        }
        const errorToThrow = new RoseNetNodeError(
          `An unknown error occured: ${error instanceof Error ? error.message : error}`,
        );
        stream?.abort(errorToThrow);
        throw error;
      }
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
          pipe(
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
        },
        { runOnTransientConnection: true },
      );
      RoseNetNodeContext.logger.debug(
        `handler for ${ROSENET_DIRECT_PROTOCOL_V1} protocol set`,
      );
    },
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
