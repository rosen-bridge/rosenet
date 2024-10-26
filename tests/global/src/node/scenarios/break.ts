import { Scenario } from '../types';
import { waitMs } from '../utils';

/**
 * A scenario during which the node simply does nothing
 */
export async function* breakSenario(): Scenario {
  while (true) {
    const timeout = yield;
    console.log(`Running break scenario for ${timeout}ms`);
    await waitMs(timeout);
    console.log('Break scenario finished');
  }
}
