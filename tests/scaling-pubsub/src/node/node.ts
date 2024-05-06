import { createRoseNetNode } from '@rosen-bridge/rosenet-node';

const node = await createRoseNetNode({
  logger: console,
  relayMultiaddrs: [process.env.RELAY_MULTIADDR!],
  privateKey: process.env.PRIVATE_KEY!,
});

await node.start();

const wait = () =>
  new Promise((resolve) => {
    setTimeout(resolve, 1 + Math.random() * 4);
  });

setTimeout(() => {
  setInterval(async () => {
    for (let i = 0; i < 10; i++) {
      try {
        node.publish('rosenet-news', Date.now().toString());
      } catch (error) {
        console.warn(
          `tried to publish a message but failed due to error: ${error}`,
        );
      }
      await wait();
    }
  }, 10_000);
}, 30_000);

node.subscribe('rosenet-news', (message) => {
  console.info(
    `Message received: ${message} (delay: ${(Date.now() - +message) / 1000}s)`,
  );
});
