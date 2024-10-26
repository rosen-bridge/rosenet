import { createRoseNetNode } from '@rosen-bridge/rosenet-node';
import { readPrivateKeyFromFile } from '@rosen-bridge/rosenet-utils';
import { random, sample } from 'lodash-es';

import config from './config';
import { registerHandlers } from './registerHandlers';
import { breakSenario } from './scenarios/break';
import { combinedScenario } from './scenarios/combined';
import { directScenario } from './scenarios/direct';
import { pubsubSenario } from './scenarios/pubsub';

const privateKey = await readPrivateKeyFromFile('.rosenet/pk');

const node = await createRoseNetNode({
  relay: {
    multiaddrs: config.relayMultiaddrs,
  },
  privateKey,
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
