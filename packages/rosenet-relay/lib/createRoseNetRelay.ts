import { gossipsub } from '@chainsafe/libp2p-gossipsub';
import { noise } from '@chainsafe/libp2p-noise';
import { circuitRelayServer } from '@libp2p/circuit-relay-v2';
import { identify } from '@libp2p/identify';
import { PeerId } from '@libp2p/interface';
import { yamux } from '@chainsafe/libp2p-yamux';
import { pubsubPeerDiscovery } from '@libp2p/pubsub-peer-discovery';
import { tcp } from '@libp2p/tcp';
import { createLibp2p } from 'libp2p';
import { ping } from '@libp2p/ping';
import { isPrivate } from '@libp2p/utils/multiaddr/is-private';

import {
  addEventListeners,
  libp2pLoggerFactory,
  privateKeyToPeerId,
} from '@rosen-bridge/rosenet-utils';

import { RoseNetRelayError } from './errors';

import {
  DEFAULT_LISTEN_HOST,
  RESERVATION_DATA_LIMIT,
  RESERVATION_DURATION_LIMIT,
} from './constants';

import packageJson from '../package.json' with { type: 'json' };

import { RoseNetRelayConfig } from './types';

const textDecoder = new TextDecoder();

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
      announceFilter: (addresses) =>
        addresses.filter((address) => !isPrivate(address)),
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
          /**
           * Ideally we want the connection to upgrade through DCUtR, but for
           * edge cases we keep these limits a reasonably large number
           */
          defaultDurationLimit: RESERVATION_DURATION_LIMIT,
          defaultDataLimit: RESERVATION_DATA_LIMIT,
        },
      }),
      pubsub: gossipsub({
        allowPublishToZeroTopicPeers: true,
        D: 0,
        Dlo: 0,
        Dhi: 0,
        Dout: 0,
        globalSignaturePolicy: 'StrictNoSign',
        ignoreDuplicatePublishError: true,
        /**
         * Current implementation of Gossipsub includes at most 5000 messages in
         * IHAVE or IWANT messages during a `mcachegossip` window, which is by
         * default 3 heartbeats. Supposing a limit of 100KB for each message, a
         * maximum of around 5000*100KB=500MB is received in 3 heartbeats from
         * a single stream, which is 500MB/3≃170MB.
         */
        maxInboundDataLength: 170_000_000, // 170MB
      }),
      identify: identify(),
      ping: ping({
        /**
         * Connection monitor component of libp2p uses `ping` internally. For
         * relays, there is a chance they have lots of connections, beyond the
         * default number of allowed `ping` steams. It should be increased to
         * prevent stream resets as a result of exceeding those limits.
         * Supposing that autodial of relays is disabled, there is no need to
         * increase outbound streams limit.
         */
        maxInboundStreams: 128,
      }),
    },
    peerDiscovery: [pubsubPeerDiscovery({ listenOnly: true })],
    nodeInfo: {
      name: 'rosenet-relay',
      version: packageJson.version,
    },
    connectionManager: {
      minConnections: 0,
    },
    logger: libp2pLoggerFactory(logger, config.debug?.libp2pComponents ?? []),
  });

  logger.debug('RoseNet relay created');

  addEventListeners(node, logger, true);

  return {
    start: async () => node.start(),
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

export default createRoseNetRelay;
