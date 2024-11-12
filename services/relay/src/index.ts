import './bootstrap';

import { DefaultLoggerFactory } from '@rosen-bridge/abstract-logger';

import { startRelay } from './relay';

const logger = DefaultLoggerFactory.getInstance().getLogger(import.meta.url);

try {
  await startRelay();
} catch (error) {
  if (error instanceof Error) {
    logger.error(`An error occurred while starting relay: [${error.message}]`);
  } else {
    logger.error(`An unknown error occurred while starting relay`);
  }
}
