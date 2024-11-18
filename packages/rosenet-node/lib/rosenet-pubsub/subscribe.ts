import { Libp2p, PubSub } from '@libp2p/interface';
import { bulkhead } from 'cockatiel';

import RoseNetNodeContext from '../context/RoseNetNodeContext';
import { PubSubMSG } from '../types';
import { messageCrypto } from '@rosen-bridge/rosenet-utils';
import peerIdFromPublicKey from '@rosen-bridge/rosenet-utils/dist/peerIdFromPublicKey';

const textDecoder = new TextDecoder();

/**
 * factory for libp2p subscribe
 */
const subscribeFactory = (node: Libp2p<{ pubsub: PubSub }>) => {
  const bulkheadPolicy = bulkhead(
    RoseNetNodeContext.config.pubsub.maxInboundThroughput,
    RoseNetNodeContext.config.pubsub.maxInboundQueueSize,
  );

  return async (
    topic: string,
    handler: (from: string, message: string) => void,
  ) => {
    node.services.pubsub.subscribe(topic);
    node.services.pubsub.addEventListener('message', async (event) => {
      try {
        await bulkheadPolicy.execute(async () => {
          if (event.detail.topic === topic) {
            const msgStr = textDecoder.decode(event.detail.data);
            const message: PubSubMSG = JSON.parse(msgStr);
            if (
              await messageCrypto.verify(
                message.senderPubKey,
                message.message,
                message.signature,
              )
            ) {
              const from = await peerIdFromPublicKey(message.senderPubKey);
              handler(from.toString(), message.message);
              RoseNetNodeContext.logger.debug('Pubsub message received', {
                message,
              });
            }
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
