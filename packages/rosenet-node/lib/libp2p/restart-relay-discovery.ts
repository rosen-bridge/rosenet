import { CircuitRelayTransport } from '@libp2p/circuit-relay-v2/src/transport/transport';
import {
  Startable,
  serviceDependencies,
  ComponentLogger,
  Logger,
} from '@libp2p/interface';
import { TransportManager } from '@libp2p/interface-internal';
import { BloomFilter } from '@libp2p/utils/filters';

import {
  BrokenCircuitError,
  circuitBreaker,
  ConsecutiveBreaker,
  handleWhenResult,
  IterableBackoff,
} from 'cockatiel';

import { MIN_RELAYS, RELAY_DISCOVERY_RESTART_INTERVAL } from '../constants';

interface RestartRelayDiscoveryComponents {
  transportManager: TransportManager;
  logger: ComponentLogger;
}

/**
 * Because of the way libp2p tries to maintain the connection to relays, a
 * proper libp2p setup for relay discovery should configure a peer router (such
 * as kad-dht) so that random walk can be done. But current implementation of
 * RoseNet doesn't configure a peer router. In addition, there MAY be an issue
 * in the relay discovery implementation which causes the discovery to halt if
 * an unexpected error occurs during the discovery. More details can be found in
 * the following issue:
 * https://github.com/libp2p/js-libp2p/issues/2676
 *
 * This libp2p service forcefully restarts the whole relay discovery whenever
 * the number of relays become smaller than a threshold. This is not a clean
 * method to do so at all, and should be removed when the above issue resolves,
 * or when a peer router is added to libp2p instance.
 */
class RestartRelayDiscovery implements Startable {
  interval: NodeJS.Timeout | null = null;
  breaker = circuitBreaker(
    handleWhenResult(() => {
      const circuitRelayTransport = this.getCircuitRelayTransport();
      return (
        circuitRelayTransport.reservationStore.reservationCount() < MIN_RELAYS
      );
    }),
    {
      breaker: new ConsecutiveBreaker(5),
      halfOpenAfter: new IterableBackoff([30_000, 45_000, 60_000]),
    },
  );
  logger: Logger;

  constructor(private components: RestartRelayDiscoveryComponents) {
    this.logger = components.logger.forComponent(
      'libp2p:restart-relay-discovery',
    );
  }

  readonly [serviceDependencies] = ['@libp2p/circuit-relay-v2-transport'];

  /**
   * @returns circuit relay transport
   */
  private getCircuitRelayTransport = () => {
    const circuitRelayTransport = this.components.transportManager
      .getTransports()
      .find(
        (transport) =>
          transport[Symbol.toStringTag] ===
          '@libp2p/circuit-relay-v2-transport',
      ) as CircuitRelayTransport;

    return circuitRelayTransport;
  };

  /**
   * restart relay discovery and clear reservation store relay filter if the
   * number of reservations is smaller than a threshold
   */
  private restartRelayDiscoveryIfNeeded = () => {
    const circuitRelayTransport = this.getCircuitRelayTransport();

    if (
      circuitRelayTransport.reservationStore.reservationCount() < MIN_RELAYS
    ) {
      circuitRelayTransport['discovery']!.stopDiscovery();
      (
        circuitRelayTransport.reservationStore['relayFilter'] as BloomFilter
      ).clear();
      circuitRelayTransport['discovery']!.startDiscovery();
      this.logger(
        'restarted relay discovery in order to re-connect some of the relays',
      );
    }
  };

  /**
   * start service
   */
  start = () => {
    this.interval = setInterval(async () => {
      try {
        await this.breaker.execute(this.restartRelayDiscoveryIfNeeded);
      } catch (error) {
        if (error instanceof BrokenCircuitError) {
          // log error
          this.logger('libp2p:restart-relay-discovery circuit is open');
        } else {
          throw error;
        }
      }
    }, RELAY_DISCOVERY_RESTART_INTERVAL);
  };

  /**
   * stop service
   */
  stop = () => {
    this.interval && clearInterval(this.interval);
  };
}

const restartRelayDiscovery = (components: RestartRelayDiscoveryComponents) =>
  new RestartRelayDiscovery(components);

export default restartRelayDiscovery;
