import './bootstrap';

import { CallbackLoggerFactory } from '@rosen-bridge/callback-logger';

import { startRelay } from './relay';

const logger = CallbackLoggerFactory.getInstance().getLogger(import.meta.url);

try {
  await startRelay();
} catch (error) {
  if (error instanceof Error) {
    logger.error(`An error occurred while starting relay: [${error.message}]`);
  } else {
    logger.error(`An unknown error occurred while starting relay`);
  }
}
