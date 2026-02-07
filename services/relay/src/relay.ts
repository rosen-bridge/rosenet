import { DefaultLogger } from '@rosen-bridge/abstract-logger';
import { createRoseNetRelay } from '@rosen-bridge/rosenet-relay';
import { readPrivateKeyFromFile } from '@rosen-bridge/rosenet-utils';

import {
  host,
  maxReservations,
  port,
  privateKeyFilePath,
  pubsubTopics,
  whitelist,
} from './configs';

const logger = DefaultLogger.getInstance().child(import.meta.url);
const rosenetLogger = DefaultLogger.getInstance().child('rosenet');

/**
 * Start relay service
 */
const startRelay = async () => {
  const privateKey = await readPrivateKeyFromFile(privateKeyFilePath);
  const node = await createRoseNetRelay({
    maxReservations,
    privateKey,
    listen: {
      host,
      port,
    },
    whitelist,
    logger: rosenetLogger,
  });

  await node.start();

  pubsubTopics.forEach((topic) => node.subscribe(topic, () => {}));

  logger.info('RoseNet relay started');
};

export { startRelay };
