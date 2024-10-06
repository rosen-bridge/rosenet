import { Libp2p, PubSub } from '@libp2p/interface';
import { bulkhead, isBulkheadRejectedError } from 'cockatiel';

import RoseNetNodeContext from '../context/RoseNetNodeContext';

import {
  MAX_OUTBOUND_PUBSUB_QUEUE_SIZE,
  MAX_OUTBOUND_PUBSUB_THROUGHPUT,
} from '../constants';

const textEncoder = new TextEncoder();

const bulkheadPolicy = bulkhead(
  MAX_OUTBOUND_PUBSUB_THROUGHPUT,
  MAX_OUTBOUND_PUBSUB_QUEUE_SIZE,
);

/**
 * factory for libp2p publish
 */
const publishFactory =
  (node: Libp2p<{ pubsub: PubSub }>) =>
  async (topic: string, message: string) => {
    try {
      await bulkheadPolicy.execute(() =>
        node.services.pubsub.publish(topic, textEncoder.encode(message)),
      );
      RoseNetNodeContext.logger.debug('Message published successfully');
    } catch (error) {
      if (isBulkheadRejectedError(error)) {
        RoseNetNodeContext.logger.debug('Maximum publish threshold reached');
      } else {
        RoseNetNodeContext.logger.debug('Message publish failed', {
          message,
        });
      }
    }
  };

export default publishFactory;
