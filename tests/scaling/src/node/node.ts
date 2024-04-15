import { createRoseNetNode } from '@rosen-bridge/rosenet-node';

const node = await createRoseNetNode({
  logger: console,
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

const messages = Array.from({ length: 10 }).map(
  (_, index) => `Ping#${index}:${process.env.NODE_PEER_ID!.slice(-5)}`,
);

setInterval(async () => {
  for (const message of messages) {
    for (const peer of process.env.ALL_PEER_IDS!.split(',')) {
      if (peer !== process.env.NODE_PEER_ID!) {
        try {
          await node.sendMessage(peer, message);
          MessageCounter.increase();
        } catch (error) {
          console.warn(
            `tried to send a message to ${peer.slice(-5)} but failed due to error: ${error}`,
          );
        }
      }
    }
  }
}, 10_000);

node.handleIncomingMessage(async (from, message) => {
  if (message?.includes('Pong')) {
    MessageCounter.decrease();
  } else {
    try {
      await node.sendMessage(from, `Pong:${message}`);
    } catch (error) {
      console.warn(
        `tried to pong message ${message} but failed due to error: ${error}`,
      );
    }
  }
});

MessageCounter.startLogger();
