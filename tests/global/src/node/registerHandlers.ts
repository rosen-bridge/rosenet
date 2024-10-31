import { createRoseNetNode } from '@rosen-bridge/rosenet-node';

import { saveDirect, savePubsub } from './metric-store';

import { serviceLogger } from './logger';

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
    const latency = roundtripEnd - roundtripStart;
    saveDirect('receive', 'success', from, latency, message!.length);
    serviceLogger.info('Direct message received', {
      from,
      latency,
      messageLength: message!.length,
    });
  });

  node.subscribe('rosenet-news', (message) => {
    const roundtripEnd = Date.now();
    const roundtripStart = +message.slice(-13);
    const latency = roundtripEnd - roundtripStart;
    savePubsub('receive', latency, message.length);
    serviceLogger.info('Pubsub message received', {
      latency,
      messageLength: message!.length,
    });
  });
};
