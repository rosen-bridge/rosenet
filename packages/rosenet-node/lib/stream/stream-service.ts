import { peerIdFromString } from '@libp2p/peer-id';
import { Multiaddr } from '@multiformats/multiaddr';
import {
  circuitBreaker,
  CircuitBreakerPolicy,
  ExponentialBackoff,
  handleAll,
  isTaskCancelledError,
  SamplingBreaker,
  timeout,
  TimeoutStrategy,
} from 'cockatiel';
import { shuffle } from 'fast-shuffle';
import { Libp2p } from 'libp2p';

import RoseNetNodeContext from '../context/RoseNetNodeContext';

import {
  ROSENET_DIRECT_PROTOCOL_V1,
  PUBLIC_MULTIADDR_DIAL_TIMEOUT,
} from '../constants';

import { RoseNetNodeError } from '../errors';

const peerBreakers = new Proxy<Record<string, CircuitBreakerPolicy>>(
  {},
  {
    get(breakers, peer: string) {
      if (peer in breakers) return breakers[peer];
      breakers[peer] = circuitBreaker(handleAll, {
        breaker: new SamplingBreaker({ duration: 5000, threshold: 0.7 }),
        halfOpenAfter: new ExponentialBackoff({
          initialDelay: 2000,
        }),
      });
      breakers[peer].onBreak(() => {
        RoseNetNodeContext.logger.debug(
          `Too many dials to ${peer} are failing, halting upcoming dials temporarily`,
        );
      });
      breakers[peer].onHalfOpen(() => {
        RoseNetNodeContext.logger.debug(
          `Retrying dial to ${peer} for resuming upcoming dials`,
        );
      });
      breakers[peer].onReset(() => {
        RoseNetNodeContext.logger.debug(
          `Retry dial to ${peer} succeeded, resuming upcoming dials`,
        );
      });
      return breakers[peer];
    },
  },
);

/**
 * get a new stream to the `to` remotePeer with ROSENET_DIRECT_PROTOCOL_V1
 * protocol
 *
 * @param to remotePeer
 * @param node
 */
async function getRoseNetDirectStreamTo(to: string, node: Libp2p) {
  const peerId = peerIdFromString(to);

  const allConnectionsToPeer = shuffle(node.getConnections(peerId));
  const possibleOpenConnectionToPeer = allConnectionsToPeer.find(
    (connection) => connection.status === 'open',
  );

  /**
   * There is a default 5 seconds dial timeout in libp2p, so there is no need to
   * add another one here
   */
  const connection =
    possibleOpenConnectionToPeer ??
    (await peerBreakers[to].execute(async () => {
      /**
       * The nodes advertise hopefully public multiaddresses, but these
       * multiaddresses may be wrong because of being behind a non-symmetric
       * NAT. In addition, there is a bug in libp2p that allows the dial to a
       * single multiaddress of a peer to take all the timeout of a dial to the
       * peer. These combined will cause the dial to nodes with unreachable
       * public multiaddresses to always fail, because their relayed
       * multiaddress is never tried.
       *
       * As a workaround, we manually first try to dial the public multiaddress
       * but with a reduced timeout, and then the other ones if the first dial
       * fails.
       *
       * Libp2p bug GitHub issue:
       * https://github.com/libp2p/js-libp2p/issues/2368
       */
      const peerAddresses = (await node.peerStore.get(peerId)).addresses;
      const [publicAddresses, otherAddresses] = peerAddresses.reduce(
        (partialPartitions, address) =>
          address.multiaddr.isThinWaistAddress()
            ? [
                [...partialPartitions[0], address.multiaddr],
                partialPartitions[1],
              ]
            : [
                partialPartitions[0],
                [
                  ...partialPartitions[1],
                  address.multiaddr.toString().endsWith('p2p-circuit')
                    ? address.multiaddr.encapsulate(`/p2p/${peerId.toString()}`)
                    : address.multiaddr,
                ],
              ],
        [[], []] as [Multiaddr[], Multiaddr[]],
      );

      if (publicAddresses) {
        try {
          return await node.dial(publicAddresses, {
            signal: AbortSignal.timeout(PUBLIC_MULTIADDR_DIAL_TIMEOUT),
          });
        } catch {
          return await node.dial(otherAddresses);
        }
      } else {
        return await node.dial(otherAddresses);
      }
    }));

  RoseNetNodeContext.logger.debug(
    possibleOpenConnectionToPeer
      ? `Found an open connection to peer ${to}`
      : `Established a new connection to peer ${to}`,
    {
      connection: {
        id: connection.id,
        transient: connection.transient,
      },
    },
  );

  const streamCreationTimeout = timeout(
    RoseNetNodeContext.config.direct.streamCreationTimeout,
    TimeoutStrategy.Aggressive,
  );
  const stream = await streamCreationTimeout
    .execute(() =>
      connection.newStream(ROSENET_DIRECT_PROTOCOL_V1, {
        runOnTransientConnection: true,
      }),
    )
    .catch((error) => {
      throw isTaskCancelledError(error)
        ? new RoseNetNodeError('Stream creation timed out', undefined, error)
        : error;
    });

  RoseNetNodeContext.logger.debug(`Created a new stream to peer ${to}`, {
    stream: {
      id: stream.id,
    },
  });

  return stream;
}

export default {
  getRoseNetDirectStreamTo,
};
