import { Libp2p, PubSub } from '@libp2p/interface';
import { bulkhead, isBulkheadRejectedError } from 'cockatiel';

import RoseNetNodeContext from '../context/RoseNetNodeContext';

const textEncoder = new TextEncoder();

/**
 * factory for libp2p publish
 */
const publishFactory = (node: Libp2p<{ pubsub: PubSub }>) => {
  const bulkheadPolicy = bulkhead(
    RoseNetNodeContext.config.pubsub.maxOutboundThroughput,
    RoseNetNodeContext.config.pubsub.maxOutboundQueueSize,
  );

  return async (topic: string, message: string) => {
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
};

export default publishFactory;
