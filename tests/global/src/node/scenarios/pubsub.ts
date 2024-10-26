import { createRoseNetNode } from '@rosen-bridge/rosenet-node';
import config from '../config';
import { wait } from '../utils';
import { random } from 'lodash-es';
import { savePubsub } from '../metric-store';
import { Scenario } from '../types';

/**
 * A scenario during which the node sends pubsub messages in bursts
 */
export async function* pubsubSenario(
  node: Awaited<ReturnType<typeof createRoseNetNode>>,
): Scenario {
  while (true) {
    const timeout = yield;
    console.log(`Running pubsub scenario for ${timeout}ms`);
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

        await node.publish('rosenet-pubsub', message);
        savePubsub('send', 0, message.length);
      }
      await wait();
    }
    console.log('Pubsub scenario finished');
  }
}
