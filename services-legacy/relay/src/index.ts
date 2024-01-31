import { startRelay } from '@rosen-bridge/p2p-relay';

import config from './configs';

/**
 * start the service
 */
const main = async () => {
  try {
    await startRelay({
      allowedPeers: config.allowedPeers,
      peerIdFilePath: config.peerIdFilePath,
      port: config.port,
    });
  } catch (error) {
    console.error(`an error occurred for start relay: [${error}]`);
    process.exit(1);
  }
};

main();
