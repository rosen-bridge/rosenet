import './bootstrap';

import { createRoseNetNode } from '@rosen-bridge/rosenet-node';
import { readPrivateKeyFromFile } from '@rosen-bridge/rosenet-utils';
import { random, sample } from 'lodash-es';

import config from './config';
import { registerHandlers } from './registerHandlers';
import { breakScenario } from './scenarios/break';
import { combinedScenario } from './scenarios/combined';
import { directScenario } from './scenarios/direct';
import { pubsubScenario } from './scenarios/pubsub';

import { serviceLogger, rosenetLogger } from './logger';

process.on('uncaughtExceptionMonitor', (error) => {
  serviceLogger.error('An uncaught exception occurred', { error });
});

const privateKey = await readPrivateKeyFromFile('.rosenet/pk').catch(
  (error) => {
    serviceLogger.error(
      'An error occurred while getting private key from file',
    );
    serviceLogger.debug(error?.message ?? 'Unknown error message');
    process.exit(1);
  },
);

const node = await createRoseNetNode({
  relay: {
    multiaddrs: config.relayMultiaddrs,
  },
  privateKey,
  logger: rosenetLogger,
});
await node.start();
serviceLogger.info('RoseNet node started');

registerHandlers(node);
serviceLogger.debug('Message handlers registered');

const scenarios = [
  directScenario(node),
  pubsubScenario(node),
  combinedScenario(node),
  breakScenario(),
];

await Promise.all(scenarios.map((scenario) => scenario.next()));

// eslint-disable-next-line no-constant-condition
while (true) {
  const scenario = sample(scenarios)!;
  await scenario.next(
    random(config.minScenarioDuration, config.maxScenarioDuration),
  );
}
