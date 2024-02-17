import { noise } from '@chainsafe/libp2p-noise';
import { circuitRelayServer } from '@libp2p/circuit-relay-v2';
import { mplex } from '@libp2p/mplex';
import { createEd25519PeerId } from '@libp2p/peer-id-factory';
import { tcp } from '@libp2p/tcp';
import { createLibp2p } from 'libp2p';

import {
  addEventListeners,
  privateKeyToPeerId,
} from '@rosen-bridge/rosenet-utils';

import { DEFAULT_LISTEN_HOST } from './constants';

import { RoseNetRelayConfig } from './types';

const createRoseNetRelay = async ({
  logger,
  ...config
}: RoseNetRelayConfig) => {
  const peerId = await (config.privateKey
    ? privateKeyToPeerId(config.privateKey)
    : createEd25519PeerId());

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
    streamMuxers: [mplex()],
    services: {
      circuitRelay: circuitRelayServer(),
    },
  });

  logger.debug('RoseNet relay created');

  addEventListeners(node, logger, true);

  return {
    start: async () => node.start(),
  };
};

export default createRoseNetRelay;
