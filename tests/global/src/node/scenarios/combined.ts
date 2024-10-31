import { createRoseNetNode } from '@rosen-bridge/rosenet-node';

import { directScenario } from './direct';
import { pubsubScenario } from './pubsub';

import { serviceLogger } from '../logger';

import { Scenario } from '../types';

/**
 * A scenario during which the node runs direct and pubsub scenarios
 * concurrently
 */
export async function* combinedScenario(
  node: Awaited<ReturnType<typeof createRoseNetNode>>,
): Scenario {
  const direct = directScenario(node);
  const pubsub = pubsubScenario(node);

  while (true) {
    const timeout = yield;
    serviceLogger.info(`Running combined scenario for ${timeout}ms`);
    await Promise.all([direct.next(timeout), pubsub.next(timeout)]);
    serviceLogger.info('Combined scenario finished');
  }
}
