import { createRoseNetNode } from '@rosen-bridge/rosenet-node';

const node = await createRoseNetNode({
  logger: console,
  relayMultiaddrs: [process.env.RELAY_MULTIADDR!],
  privateKey: process.env.PRIVATE_KEY!,
});

await node.start();

const messages = Array.from({ length: 1000 }).map(
  (_, index) => `Ping#${index}`,
);

if (process.env.MODE === 'dialer') {
  setTimeout(async () => {
    for (const message of messages) {
      await node.sendMessage(process.env.LISTENER_PEER_ID!, message);
    }
    setTimeout(() => {
      process.exit(0);
    }, 2000);
  }, 10000);
} else {
  node.handleIncomingMessage((from, message) => {
    if (message === messages.at(-1)) {
      setTimeout(() => {
        process.exit(0);
      }, 2000);
    }
  });
}

// This timeout works like a Promise.race, if above process.exit is not called
// for some reason
setTimeout(() => {
  process.exit(0);
}, 20000);
