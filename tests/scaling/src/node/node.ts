import { createRoseNetNode } from '@rosen-bridge/rosenet-node';

const node = await createRoseNetNode({
  logger: {
    ...console,
    debug: () => {},
  },
  relayMultiaddrs: [process.env.RELAY_MULTIADDR!],
  privateKey: process.env.PRIVATE_KEY!,
});

await node.start();

const MessageCounter = {
  ackWaiting: 0,
  total: 0,
  increase() {
    this.ackWaiting += 1;
    this.total += 1;
  },
  decrease() {
    this.ackWaiting -= 1;
  },
  startLogger() {
    setInterval(() => {
      console.info(
        `>>> Counter: ${this.ackWaiting}, Total: ${this.total}, loss: ${this.ackWaiting && this.total ? ((this.ackWaiting * 100) / this.total).toFixed(2) : 0}%`,
      );
    }, 30_000);
  },
};

const wait = () =>
  new Promise((resolve) => {
    setTimeout(resolve, 1 + Math.random() * 9);
  });

const messages = Array.from({ length: 10 }).map(
  (_, index) =>
    `Ping@${new Date().toLocaleTimeString([], { hour12: false })}#${index}:${process.env.NODE_PEER_ID!.slice(-5)}`,
);

setTimeout(() => {
  setInterval(async () => {
    for (const message of messages) {
      for (const peer of process.env.ALL_PEER_IDS!.split(',')) {
        if (peer !== process.env.NODE_PEER_ID!) {
          try {
            const actualMessage = `${message}->${peer.slice(-5)}`;
            await node.sendMessage(peer, actualMessage);
            MessageCounter.increase();
            console.info(`Message sent: ${actualMessage}`);
          } catch (error) {
            console.warn(
              `tried to send a message to ${peer.slice(-5)} but failed due to error: ${error}`,
            );
          }
          await wait();
        }
      }
    }
  }, 10_000);
}, 30_000);

node.handleIncomingMessage(async (from, message) => {
  if (message?.includes('Pong')) {
    console.info(`Pong received: ${message}`);
    MessageCounter.decrease();
  } else {
    console.info(`Message received: ${message}`);
    try {
      const actualMessage = `Pong@${new Date().toLocaleTimeString([], { hour12: false })}:${message}`;
      await node.sendMessage(from, actualMessage);
      console.info(`Pong sent: ${actualMessage}`);
    } catch (error) {
      console.warn(
        `tried to pong message ${message} but failed due to error: ${error}`,
      );
    }
  }
});

MessageCounter.startLogger();
