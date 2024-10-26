import { createRoseNetNode } from '@rosen-bridge/rosenet-node';
import { random, sample } from 'lodash-es';

import config from '../config';
import { saveDirect } from '../metric-store';
import { waitBeforeNextBurst } from '../utils';

import logger from '../logger';

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
    logger.info(`Running direct scenario for ${timeout}ms`);
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
      logger.info(
        `Sending ${config.directBurstSize} direct messages to random peers`,
      );
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
          const latency = roundtripEnd - roundtripStart;
          saveDirect(
            'send',
            error ? 'failure' : 'success',
            peer,
            latency,
            message.length,
          );
          if (error) {
            logger.warn(
              `An error occurred while sending message to peer ${peer.slice(0, 5)}...${peer.slice(-5)}`,
              { error },
            );
          } else {
            logger.info(
              `Message sent to peer ${peer.slice(0, 5)}...${peer.slice(-5)} successfully`,
              {
                latency,
                messageLength: message.length,
              },
            );
          }
        });
      }
      await waitBeforeNextBurst();
    }
    logger.info('Direct scenario finished');
  }
}
