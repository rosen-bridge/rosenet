import { createRoseNetRelay } from '@rosen-bridge/rosenet-relay';
import { readPrivateKeyFromFile } from '@rosen-bridge/rosenet-utils';

import config from './config';

const privateKey = await readPrivateKeyFromFile('.rosenet/pk');

const node = await createRoseNetRelay({
  logger: console,
  privateKey,
  listen: {
    host: '0.0.0.0',
    port: 44123,
  },
  whitelist: config.whitelist,
  maxReservations: config.maxReservations,
});

await node.start();
node.subscribe('rosenet-news', () => {});
