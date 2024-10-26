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
 * Wait for a random duration based on config
 */
export const wait = () =>
  waitMs(random(config.minIdleTime, config.maxIdleTime));
