import { noise } from '@chainsafe/libp2p-noise';
import { bootstrap } from '@libp2p/bootstrap';
import { circuitRelayTransport } from '@libp2p/circuit-relay-v2';
import { mplex } from '@libp2p/mplex';
import { tcp } from '@libp2p/tcp';
import { createLibp2p } from 'libp2p';

import RoseNetNodeError from './errors/RoseNetNodeError';

import { RELAYS_COUNT_TO_CONNECT } from './constants';

import { RoseNetNodeConfig } from './types';

const createRoseNetNode = async (config: RoseNetNodeConfig) => {
  if (!config.relayMultiaddrs.length) {
    throw new RoseNetNodeError('Cannot start a RoseNet node without a relay');
  }

  const node = await createLibp2p({
    transports: [
      circuitRelayTransport({
        discoverRelays: RELAYS_COUNT_TO_CONNECT,
      }),
      tcp(),
    ],
    connectionEncryption: [noise()],
    streamMuxers: [mplex()],
    peerDiscovery: [
      bootstrap({
        list: config.relayMultiaddrs,
      }),
    ],
  });
  config.logger.debug('RoseNet node created');

  return {
    start: async () => node.start(),
  };
};

export default createRoseNetNode;
