import { createRoseNetNode } from '@rosen-bridge/rosenet-node';

import { directScenario } from './direct';
import { pubsubSenario } from './pubsub';
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
    console.log(`Running combined scenario for ${timeout}ms`);
    await Promise.all([direct.next(timeout), pubsub.next(timeout)]);
    console.log('Combined scenario finished');
  }
}
