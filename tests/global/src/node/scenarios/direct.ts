import { createRoseNetNode } from '@rosen-bridge/rosenet-node';
import config from '../config';
import { saveDirect } from '../metric-store';
import { wait } from '../utils';
import { random, sample } from 'lodash-es';
import { Scenario } from '../types';

const allConnectedPeersSoFar = new Set<string>();

/**
 * A scenario during which the node sends direct messages to random nodes in
 * bursts
 */
export async function* directScenario(
  node: Awaited<ReturnType<typeof createRoseNetNode>>,
): Scenario {
  while (true) {
    const timeout = yield;
    console.log(`Running direct scenario for ${timeout}ms`);
    const signal = AbortSignal.timeout(timeout);
    const peers = node.info
      .getConnectedPeers()
      .filter(
        (peer) =>
          !config.relayMultiaddrs.some((relayMultiaddr) =>
            relayMultiaddr.includes(peer),
          ),
      );
    peers.forEach(allConnectedPeersSoFar.add);
    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (signal.aborted) {
        break;
      }
      for (let i = 0; i < config.directBurstSize; i++) {
        const peer = sample(
          config.shouldSendDirectToOldPeers
            ? [...allConnectedPeersSoFar]
            : peers,
        );
        if (!peer) continue;
        const message = 'r'
          .repeat(random(config.minMessageSize, config.maxMessageSize))
          .concat(Date.now().toString());

        const roundtripStart = Date.now();
        await node.sendMessage(peer, message, async (error) => {
          const roundtripEnd = Date.now();
          saveDirect(
            'send',
            error ? 'failure' : 'success',
            peer,
            roundtripEnd - roundtripStart,
            message.length,
          );
          // if (error) {
          //   saveDirect('failure', peer, 0, message.length);
          // } else {
          //   saveDirect(
          //     'success',
          //     peer,
          //     roundtripEnd - roundtripStart,
          //     message.length,
          //   );
          // }
        });
      }
      await wait();
    }
    console.log('Direct scenario finished');
  }
}
