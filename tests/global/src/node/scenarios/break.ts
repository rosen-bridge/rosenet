import { waitMs } from '../utils';

import logger from '../logger';

import { Scenario } from '../types';

/**
 * A scenario during which the node simply does nothing
 */
export async function* breakScenario(): Scenario {
  while (true) {
    const timeout = yield;
    logger.info(`Running break scenario for ${timeout}ms`);
    await waitMs(timeout);
    logger.info('Break scenario finished');
  }
}
