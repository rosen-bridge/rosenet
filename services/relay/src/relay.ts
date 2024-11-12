import { DefaultLoggerFactory } from '@rosen-bridge/abstract-logger';
import { createRoseNetRelay } from '@rosen-bridge/rosenet-relay';
import { readPrivateKeyFromFile } from '@rosen-bridge/rosenet-utils';

import {
  host,
  port,
  privateKeyFilePath,
  pubsubTopics,
  whitelist,
} from './configs';

const logger = DefaultLoggerFactory.getInstance().getLogger(import.meta.url);
const rosenetLogger = DefaultLoggerFactory.getInstance().getLogger('rosenet');

/**
 * Start relay service
 */
const startRelay = async () => {
  const privateKey = await readPrivateKeyFromFile(privateKeyFilePath);
  const node = await createRoseNetRelay({
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
