import { createRoseNetNode } from '@rosen-bridge/rosenet-node';

import { saveDirect, savePubsub } from './metric-store';

/**
 * Register pubsub and direct message handlers
 *
 * @param node
 */
export const registerHandlers = (
  node: Awaited<ReturnType<typeof createRoseNetNode>>,
) => {
  node.handleIncomingMessage(async (from, message) => {
    const roundtripEnd = Date.now();
    const roundtripStart = +message!.slice(-13);
    saveDirect(
      'receive',
      'success',
      from,
      roundtripEnd - roundtripStart,
      message!.length,
    );
  });

  node.subscribe('rosenet-news', (message) => {
    const roundtripEnd = Date.now();
    const roundtripStart = +message.slice(-13);
    savePubsub('receive', roundtripEnd - roundtripStart, message.length);
  });
};
