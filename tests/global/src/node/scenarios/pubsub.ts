import { createRoseNetNode } from '@rosen-bridge/rosenet-node';
import { random } from 'lodash-es';

import config from '../config';
import { savePubsub } from '../metric-store';
import { waitBeforeNextBurst } from '../utils';

import logger from '../logger';

import { Scenario } from '../types';

/**
 * A scenario during which the node sends pubsub messages in bursts
 */
export async function* pubsubScenario(
  node: Awaited<ReturnType<typeof createRoseNetNode>>,
): Scenario {
  while (true) {
    const timeout = yield;
    logger.info(`Running pubsub scenario for ${timeout}ms`);
    const signal = AbortSignal.timeout(timeout);
    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (signal.aborted) {
        break;
      }
      for (let i = 0; i < config.pubsubBurstSize; i++) {
        const message = 'r'
          .repeat(random(config.minMessageSize, config.maxMessageSize))
          .concat(Date.now().toString());

        await node.publish('rosenet-pubsub', message).catch((error) => {
          logger.warn(`An error occurred while publishing message`, { error });
        });
        savePubsub('send', 0, message.length);
        logger.info(`Message published successfully`, {
          messageLength: message.length,
        });
      }
      await waitBeforeNextBurst();
    }
    logger.info('Pubsub scenario finished');
  }
}
