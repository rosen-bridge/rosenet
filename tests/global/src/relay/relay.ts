import './bootstrap';

import { createRoseNetRelay } from '@rosen-bridge/rosenet-relay';
import { readPrivateKeyFromFile } from '@rosen-bridge/rosenet-utils';

import config from './config';

import { serviceLogger, rosenetLogger } from './logger';

const privateKey = await readPrivateKeyFromFile('.rosenet/pk');

const node = await createRoseNetRelay({
  privateKey,
  listen: {
    host: '0.0.0.0',
    port: 44123,
  },
  whitelist: config.whitelist,
  maxReservations: config.maxReservations,
  logger: rosenetLogger,
});

await node.start();
node.subscribe('rosenet-news', () => {});

serviceLogger.info('RoseNet relay started');
