import { createRoseNetNode } from '@rosen-bridge/rosenet-node';

const node = await createRoseNetNode({
  logger: console,
  relayMultiaddrs: [process.env.RELAY_MULTIADDR!],
  privateKey: process.env.PRIVATE_KEY!,
});

await node.start();

const messages = Array.from({ length: 1000 }).map(
  (_, index) => `Ping#${index}:${process.env.NODE_PEER_ID!.slice(-5)}`,
);

setTimeout(async () => {
  for (const message of messages) {
    for (const peer of process.env.ALL_PEER_IDS!) {
      await node.sendMessage(peer, message);
    }
  }
  setTimeout(() => {
    process.exit(0);
  }, 5000);
}, 10000);

// This timeout works like a Promise.race, if above process.exit is not called
// for some reason
setTimeout(() => {
  process.exit(0);
}, 50000);
