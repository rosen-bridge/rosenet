import { createRoseNetNode } from '@rosen-bridge/rosenet-node';

import { directScenario } from './direct';
import { pubsubSenario } from './pubsub';

import logger from '../logger';

import { Scenario } from '../types';

/**
 * A scenario during which the node runs direct and pubsub scenarios
 * concurrently
 */
export async function* combinedScenario(
  node: Awaited<ReturnType<typeof createRoseNetNode>>,
): Scenario {
  const direct = directScenario(node);
  const pubsub = pubsubSenario(node);

  while (true) {
    const timeout = yield;
    logger.info(`Running combined scenario for ${timeout}ms`);
    await Promise.all([direct.next(timeout), pubsub.next(timeout)]);
    logger.info('Combined scenario finished');
  }
}
