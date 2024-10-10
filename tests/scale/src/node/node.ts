import { createRoseNetNode } from '@rosen-bridge/rosenet-node';

const node = await createRoseNetNode({
  logger: console,
  relayMultiaddrs: process.env.RELAY_MULTIADDRS!.split(','),
  privateKey: process.env.PRIVATE_KEY!,
  port: +process.env.PORT!,
});

const largeMessage = 'x'.repeat(100_000);

await node.start();

const wait = () =>
  new Promise((resolve) => {
    setTimeout(
      resolve,
      5 +
        (3000 - Math.random() * 3000 + Math.random() * 6000) *
          (Math.random() > 0.1 ? 1 : Math.random() < 0.1 ? 5 : 0.001),
    );
  });

let sent = 0;
let received = 0;
let totalDelay = 0;
let maxDelay = 0;

let counter = 0;
const data: Record<string, { r: number; ss: number; sf: number }> = {};

setTimeout(async () => {
  // eslint-disable-next-line no-constant-condition
  while (counter <= 20000) {
    const currentCounter = counter;
    for (let i = 0; i < Math.random() * 30; i++) {
      counter++;
      if (Math.floor(counter / 50) % 6 === 5) {
        console.log('> on a break');
        break;
      }
      for (const peer of process.env.ALL_PEER_IDS!.split(',')) {
        if (peer !== process.env.NODE_PEER_ID! && Math.random() > 0.2) {
          node.sendMessage(peer, largeMessage, async (error) => {
            if (error) {
              console.warn(`🚫 ${currentCounter} -> ${peer.slice(-5)}`);
              data[peer.slice(-5)] = {
                r: data[peer.slice(-5)]?.r ?? 0,
                ss: data[peer.slice(-5)]?.ss ?? 0,
                sf: data[peer.slice(-5)]?.sf ? data[peer.slice(-5)]?.sf + 1 : 1,
              };
            } else {
              console.info(`✅ ${currentCounter} -> ${peer.slice(-5)}`);
              data[peer.slice(-5)] = {
                r: data[peer.slice(-5)]?.r ?? 0,
                ss: data[peer.slice(-5)]?.ss ? data[peer.slice(-5)]?.ss + 1 : 1,
                sf: data[peer.slice(-5)]?.sf ?? 0,
              };
            }
          });
        }
      }

      const message = `${largeMessage}.${Date.now().toString()}`;
      await node.publish('rosenet-news', message);
      sent++;
    }
    await wait();
  }
}, 30_000);

node.handleIncomingMessage(async (from) => {
  data[from.slice(-5)] = {
    r: data[from.slice(-5)]?.r ? data[from.slice(-5)].r + 1 : 1,
    ss: data[from.slice(-5)]?.ss ?? 0,
    sf: data[from.slice(-5)]?.sf ?? 0,
  };
});

node.subscribe('rosenet-news', (message) => {
  received++;
  const delay = +(Date.now() - +message.split('.')[1]) / 1000;
  totalDelay += +(Date.now() - +message.split('.')[1]) / 1000;
  maxDelay = Math.max(maxDelay, delay);
});

setInterval(() => {
  console.table({
    s: sent,
    r: received,
    avg: (totalDelay / (received || 1)).toFixed(3),
    max: maxDelay.toFixed(3),
  });
  console.table(
    Object.keys(data).reduce(
      (acc, cur) => ({
        ...acc,
        [cur]: {
          ...data[cur],
          rate: +(
            (data[cur].ss / (data[cur].ss + data[cur].sf || 1)) *
            100
          ).toFixed(2),
        },
      }),
      {},
    ),
  );
}, 3000);
