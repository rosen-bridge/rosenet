import { createRoseNetNode } from '@rosen-bridge/rosenet-node';

const node = await createRoseNetNode({
  logger: console,
  relayMultiaddrs: process.env.RELAY_MULTIADDRS!.split(','),
  privateKey: process.env.PRIVATE_KEY!,
  whitelist: [process.env.WHITELISTED_PEER_ID!],
});

node.start();
