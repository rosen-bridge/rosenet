import { createRoseNetNode } from '@rosen-bridge/rosenet-node';

const node = await createRoseNetNode({
  logger: {
    ...console,
    debug: () => {},
  },
  relayMultiaddrs: [process.env.RELAY_MULTIADDR!],
  privateKey: process.env.PRIVATE_KEY!,
});

const largeMessage = 'x'.repeat(100_000); // 100kB string

await node.start();

const wait = () =>
  new Promise((resolve) => {
    setTimeout(resolve, 1 + Math.random() * 4);
  });

setTimeout(async () => {
  // send some large messages to initiate connections with other peers
  const messages = Array.from({ length: 10 }).map(() => largeMessage);
  for (const message of messages) {
    for (const peer of process.env.ALL_PEER_IDS!.split(',')) {
      if (peer !== process.env.NODE_PEER_ID!) {
        try {
          await node.sendMessage(peer, message);
          console.info(`Large message sent, size: ${message.length}`);
        } catch (error) {
          console.warn(
            `tried to send a large message to ${peer.slice(-5)} but failed due to error: ${error}`,
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
        const message = `${largeMessage}.${Date.now().toString()}`;
        node.publish('rosenet-news', message);
        console.info(`Large message published, length: ${message.length}`);
      } catch (error) {
        console.warn(
          `tried to publish a large message but failed due to error: ${error}`,
        );
      }
      await wait();
    }
  }, 10_000);
}, 30_000);

node.handleIncomingMessage(async (_, message) => {
  console.info(`Large message received, length: ${message?.length}`);
});

node.subscribe('rosenet-news', (message) => {
  console.info(
    `Large message received, length: ${message.length} (delay: ${(Date.now() - +message.split('.')[1]) / 1000}s)`,
  );
});
