import { createLibp2p } from 'libp2p';

import { gossipsub } from '@chainsafe/libp2p-gossipsub';
import { noise } from '@chainsafe/libp2p-noise';

import { mplex } from '@libp2p/mplex';
import { pubsubPeerDiscovery } from '@libp2p/pubsub-peer-discovery';
import { webSockets } from '@libp2p/websockets';

import { getOrCreatePeerID, savePeerIdIfNeed } from './utils';

import { RelayNodeConfig } from './types';

/**
 * start a relay node based on config
 *
 * @param relayNodeConfig
 */
const startRelay = async (relayNodeConfig: RelayNodeConfig) => {
  const peerId = await getOrCreatePeerID(relayNodeConfig.peerIdFilePath);

  const node = await createLibp2p({
    peerId: peerId.peerId,
    addresses: {
      listen: [`/ip4/0.0.0.0/tcp/${relayNodeConfig.port}/ws`],
    },
    transports: [webSockets()],
    connectionEncryption: [noise()],
    streamMuxers: [mplex()],
    relay: {
      enabled: true,
      hop: {
        enabled: true,
        timeout: 600_000, // 10 minutes
      },
    },
    pubsub: gossipsub({ allowPublishToZeroPeers: true }),
    peerDiscovery: [
      pubsubPeerDiscovery({
        interval: 1000,
      }),
    ],
  });

  // Listen for new peers
  node.addEventListener('peer:discovery', (evt) => {
    console.log(`Found peer ${evt.detail.id.toString()}`);
  });

  // Listen for new connections to peers
  node.connectionManager.addEventListener('peer:connect', (evt) => {
    const connection = evt.detail;

    const connectedPeer = connection.remotePeer.toString();

    if (relayNodeConfig.allowedPeers.includes(connectedPeer)) {
      console.log(`Connected to ${connectedPeer}`);
    } else {
      // Drop connections from disallowed peers
      connection.close();
      console.log(
        `Connection from ${connectedPeer} rejected due to allow list config`
      );
    }
  });

  // Listen for peers disconnecting
  node.connectionManager.addEventListener('peer:disconnect', (evt) => {
    console.log(`Disconnected from ${evt.detail.remotePeer.toString()}`);
  });

  await node.start();

  await savePeerIdIfNeed(peerId, relayNodeConfig.peerIdFilePath);

  console.log(`Relay node started with id ${node.peerId.toString()}`);
  console.log('Listening on:');
  node.getMultiaddrs().forEach((ma) => console.log(ma.toString()));

  /**
   * TODO: This is not the ideal way to increase the streams limits, but there
   * seems to be no other way to do it with current libp2p apis. It needs to
   * be changed if such an api is added in the future.
   *
   * Related issues:
   * - https://github.com/libp2p/js-libp2p/issues/1518
   * local:ergo/rosen-bridge/p2p#6
   */
  const handler = node.registrar.getHandler('/libp2p/circuit/relay/0.1.0');
  node.registrar.unhandle('/libp2p/circuit/relay/0.1.0');
  await node.registrar.handle('/libp2p/circuit/relay/0.1.0', handler.handler, {
    ...handler.options,
    maxInboundStreams: 1000,
    maxOutboundStreams: 1000,
  });

  return node;
};

export { startRelay };
