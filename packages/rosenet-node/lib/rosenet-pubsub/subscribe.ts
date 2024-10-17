import { Libp2p, PubSub } from '@libp2p/interface';
import { bulkhead } from 'cockatiel';

import RoseNetNodeContext from '../context/RoseNetNodeContext';

const textDecoder = new TextDecoder();

/**
 * factory for libp2p subscribe
 */
const subscribeFactory = (node: Libp2p<{ pubsub: PubSub }>) => {
  const bulkheadPolicy = bulkhead(
    RoseNetNodeContext.config.pubsub.maxInboundThroughput,
    RoseNetNodeContext.config.pubsub.maxInboundQueueSize,
  );

  return async (topic: string, handler: (message: string) => void) => {
    node.services.pubsub.subscribe(topic);
    node.services.pubsub.addEventListener('message', async (event) => {
      try {
        await bulkheadPolicy.execute(() => {
          if (event.detail.topic === topic) {
            const message = textDecoder.decode(event.detail.data);
            handler(message);
            RoseNetNodeContext.logger.debug('Pubsub message received', {
              message,
            });
          }
        });
      } catch {
        RoseNetNodeContext.logger.warn(
          'Maximum pubsub message handling threshold reached',
        );
      }
    });
    RoseNetNodeContext.logger.info(`Topic ${topic} subscribed`);
  };
};

export default subscribeFactory;
