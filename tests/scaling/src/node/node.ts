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

setInterval(async () => {
  for (const message of messages) {
    for (const peer of process.env.ALL_PEER_IDS!.split(',')) {
      if (peer !== process.env.NODE_PEER_ID!) {
        try {
          await node.sendMessage(peer, message);
        } catch (error) {
          console.warn(
            `tried to send a message to ${peer.slice(-5)} but failed due to error: ${error}`,
          );
        }
      }
    }
  }
}, 10000);
