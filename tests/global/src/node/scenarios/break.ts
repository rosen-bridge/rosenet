import { waitMs } from '../utils';

import { serviceLogger } from '../logger';

import { Scenario } from '../types';

/**
 * A scenario during which the node simply does nothing
 */
export async function* breakScenario(): Scenario {
  while (true) {
    const timeout = yield;
    serviceLogger.info(`Running break scenario for ${timeout}ms`);
    await waitMs(timeout);
    serviceLogger.info('Break scenario finished');
  }
}
