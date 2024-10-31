import { random } from 'lodash-es';
import config from './config';

/**
 * Wait for a specific duration
 * @param ms
 */
export const waitMs = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * Wait for a random duration based on config before firing next burst of
 * messages
 */
export const waitBeforeNextBurst = () =>
  waitMs(random(config.minIdleTime, config.maxIdleTime));
