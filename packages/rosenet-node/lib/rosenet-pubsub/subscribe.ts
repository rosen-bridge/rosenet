import { Libp2p, PubSub } from '@libp2p/interface';
import { bulkhead } from 'cockatiel';

import RoseNetNodeContext from '../context/RoseNetNodeContext';

import {
  MAX_INBOUND_PUBSUB_QUEUE_SIZE,
  MAX_INBOUND_PUBSUB_THROUGHPUT,
} from '../constants';

const textDecoder = new TextDecoder();

const bulkheadPolicy = bulkhead(
  MAX_INBOUND_PUBSUB_THROUGHPUT,
  MAX_INBOUND_PUBSUB_QUEUE_SIZE,
);

/**
 * factory for libp2p subscribe
 */
const subscribeFactory =
  (node: Libp2p<{ pubsub: PubSub }>) =>
  async (topic: string, handler: (message: string) => void) => {
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

export default subscribeFactory;
