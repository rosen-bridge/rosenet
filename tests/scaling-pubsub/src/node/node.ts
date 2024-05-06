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

setTimeout(async () => {
  // send some messages to initiate connections with other peers
  const messages = Array.from({ length: 10 }).map((_, index) =>
    index.toString(),
  );
  for (const message of messages) {
    for (const peer of process.env.ALL_PEER_IDS!.split(',')) {
      if (peer !== process.env.NODE_PEER_ID!) {
        try {
          await node.sendMessage(peer, message);
          console.info(`Message sent: ${message}`);
        } catch (error) {
          console.warn(
            `tried to send a message to ${peer.slice(-5)} but failed due to error: ${error}`,
          );
        }
        await wait();
      }
    }
  }

  // then start publishing periodically
  setInterval(async () => {
    for (let i = 0; i < 10; i++) {
      try {
        const message = Date.now().toString();
        node.publish('rosenet-news', message);
        console.info(`Message published: ${message}`);
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
