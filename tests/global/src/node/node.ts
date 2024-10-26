import './bootstrap';

import { createRoseNetNode } from '@rosen-bridge/rosenet-node';
import { readPrivateKeyFromFile } from '@rosen-bridge/rosenet-utils';
import { random, sample } from 'lodash-es';

import config from './config';
import { registerHandlers } from './registerHandlers';
import { breakSenario } from './scenarios/break';
import { combinedScenario } from './scenarios/combined';
import { directScenario } from './scenarios/direct';
import { pubsubSenario } from './scenarios/pubsub';

import logger from './logger';

process.on('uncaughtException', (error) => {
  logger.error('An uncaught exception occurred');
  logger.debug(error?.message ?? 'Unknown error message');
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  logger.error('An unhandled rejection occurred');
  logger.debug(
    (error instanceof Error && error?.message) || 'Unknown error message',
  );
  process.exit(1);
});

const privateKey = await readPrivateKeyFromFile('.rosenet/pk').catch(
  (error) => {
    logger.error('An error occurred while getting private key from file');
    logger.debug(error?.message ?? 'Unknown error message');
    process.exit(1);
  },
);

const node = await createRoseNetNode({
  relay: {
    multiaddrs: config.relayMultiaddrs,
  },
  privateKey,
  logger,
});
await node.start();

registerHandlers(node);

const scenarios = [
  directScenario(node),
  pubsubSenario(node),
  combinedScenario(node),
  breakSenario(),
];

await Promise.all(scenarios.map((scenario) => scenario.next()));

// eslint-disable-next-line no-constant-condition
while (true) {
  const scenario = sample(scenarios)!;
  await scenario.next(
    random(config.minScenarioDuration, config.maxScenarioDuration),
  );
}
