import { Libp2p } from 'libp2p';
import { diffString, DiffStringOptions } from 'json-diff';
import { AbstractLogger } from '@rosen-bridge/logger-interface';

const jsonDiffOptions: DiffStringOptions = {
  color: false,
  sort: true,
  maxElisions: 0,
};

/**
 * Log different events of a RoseNet node or relay
 *
 * @param node
 * @param logger
 * @param isRelay
 */
const addEventListeners = (
  node: Libp2p,
  logger: AbstractLogger,
  isRelay = false,
) => {
  node.addEventListener('connection:close', ({ detail: connection }) => {
    logger.debug('Connection closed', {
      connectionRemoteAddress: connection.remoteAddr.toString(),
    });
  });
  node.addEventListener('connection:open', ({ detail: connection }) => {
    logger.debug('Connection opened', {
      connectionRemoteAddress: connection.remoteAddr.toString(),
    });
  });
  node.addEventListener('connection:prune', ({ detail: connections }) => {
    logger.debug('Some connections pruned', {
      connectionRemoteAddresses: connections.map((connection) =>
        connection.remoteAddr.toString(),
      ),
    });
  });

  node.addEventListener('peer:connect', ({ detail: peerId }) => {
    logger.debug('Peer connected', { peerId: peerId.toString() });
  });
  node.addEventListener('peer:disconnect', ({ detail: peerId }) => {
    logger.debug('Peer disconnected', { peerId: peerId.toString() });
  });
  node.addEventListener('peer:discovery', ({ detail: peerInfo }) => {
    logger.debug('Peer discovered', {
      peerId: peerInfo.id.toString(),
      peerMultiAddresses: peerInfo.multiaddrs.map((multiAddress) =>
        multiAddress.toString(),
      ),
    });
  });
  node.addEventListener('peer:identify', ({ detail: identifyResult }) => {
    logger.debug('Peer identified', {
      nodeInfo: identifyResult.agentVersion,
      peerId: identifyResult.peerId.toString(),
      listenAddresses: identifyResult.listenAddrs.map((multiAddress) =>
        multiAddress.toString(),
      ),
      observedAddress: identifyResult.observedAddr?.toString(),
    });
  });
  node.addEventListener('peer:update', ({ detail: peerUpdate }) => {
    const diff = diffString(
      {
        multiAddresses: peerUpdate.previous?.addresses.map((address) =>
          address.multiaddr.toString(),
        ),
        protocols: peerUpdate.previous?.protocols,
      },
      {
        multiAddresses: peerUpdate.peer.addresses.map((address) =>
          address.multiaddr.toString(),
        ),
        protocols: peerUpdate.peer.protocols,
      },
      jsonDiffOptions,
    );

    if (!diff) return;

    logger.debug('Peer updated', {
      id: peerUpdate.peer.id.toString(),
    });
    logger.debug(diff);
  });

  node.addEventListener('self:peer:update', ({ detail: peerUpdate }) => {
    const diff = diffString(
      {
        multiAddresses: peerUpdate.previous?.addresses.map((address) =>
          address.multiaddr.toString(),
        ),
        protocols: peerUpdate.previous?.protocols,
      },
      {
        multiAddresses: peerUpdate.peer.addresses.map((address) =>
          address.multiaddr.toString(),
        ),
        protocols: peerUpdate.peer.protocols,
      },
      jsonDiffOptions,
    );

    if (!diff) return;

    logger.debug('Our own peer updated');
    logger.debug(diff);
  });

  node.addEventListener('start', () => {
    logger.info(`RoseNet ${isRelay ? 'relay' : 'node'} started`);
  });
  node.addEventListener('stop', () => {
    logger.info(`RoseNet ${isRelay ? 'relay' : 'node'} stopped`);
  });

  node.addEventListener('transport:close', ({ detail: transport }) => {
    logger.debug('Transport closed', {
      transportMultiAddresses: transport
        .getAddrs()
        .map((multiAddress) => multiAddress.toString()),
    });
  });
  node.addEventListener('transport:listening', ({ detail: transport }) => {
    logger.debug('Transport listening', {
      transportMultiAddresses: transport
        .getAddrs()
        .map((multiAddress) => multiAddress.toString()),
    });
  });
};

export default addEventListeners;
