import { createRoseNetNode } from '@rosen-bridge/rosenet-node';

const node = await createRoseNetNode({
  logger: console,
  relayMultiaddrs: [process.env.RELAY_MULTIADDR!],
  privateKey: process.env.PRIVATE_KEY!,
});

node.start();
