import { createRoseNetRelay } from '@rosen-bridge/rosenet-relay';

const node = await createRoseNetRelay({
  logger: console,
  privateKey: process.env.PRIVATE_KEY!,
  listen: {
    host: '0.0.0.0',
    port: Number(process.env.LISTEN_PORT),
  },
  whitelist: [process.env.WHITELISTED_PEER_ID!],
});

node.start();
