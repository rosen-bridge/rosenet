import { Libp2p, PubSub } from '@libp2p/interface';

const textDecoder = new TextDecoder();

/**
 * factory for libp2p subscribe
 */
const subscribeFactory =
  (node: Libp2p<{ pubsub: PubSub }>) =>
  async (topic: string, handler: (message: string) => void) => {
    node.services.pubsub.subscribe(topic);
    node.services.pubsub.addEventListener('message', (event) => {
      if (event.detail.topic === topic) {
        handler(textDecoder.decode(event.detail.data));
      }
    });
  };

export default subscribeFactory;
