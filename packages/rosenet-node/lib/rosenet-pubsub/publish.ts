import { Libp2p, PubSub } from '@libp2p/interface';

const textEncoder = new TextEncoder();

/**
 * factory for libp2p publish
 */
const publishFactory =
  (node: Libp2p<{ pubsub: PubSub }>) =>
  async (topic: string, message: string) => {
    node.services.pubsub.publish(topic, textEncoder.encode(message));
  };

export default publishFactory;
