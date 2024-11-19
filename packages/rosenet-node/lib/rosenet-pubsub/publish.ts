import { Libp2p, PubSub } from '@libp2p/interface';
import { bulkhead, isBulkheadRejectedError } from 'cockatiel';

import RoseNetNodeContext from '../context/RoseNetNodeContext';
import { PubSubMSG } from '../types';
import { messageCrypto } from '@rosen-bridge/rosenet-utils';

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
      const signature = await messageCrypto.sign(
        node.peerId.privateKey!,
        message,
      );
      const finalMsg: PubSubMSG = {
        senderPubKey: Buffer.from(node.peerId.publicKey!).toString('hex'),
        signature: signature,
        message: message,
      };
      await bulkheadPolicy.execute(() =>
        node.services.pubsub.publish(
          topic,
          textEncoder.encode(JSON.stringify(finalMsg)),
        ),
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
