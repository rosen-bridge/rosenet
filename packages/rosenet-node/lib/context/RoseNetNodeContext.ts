import { AbstractLogger } from '@rosen-bridge/logger-interface';
import merge from 'lodash.merge';

import { PartialRoseNetNodeConfig, RoseNetNodeConfig } from '../types';

import {
  DEFAULT_FAIL_FAST_MESSAGE_RETRY_ATTEMPTS,
  DEFAULT_FAIL_FAST_MESSAGE_RETRY_INITIAL_DELAY,
  DEFAULT_FAIL_FAST_THRESHOLD,
  DEFAULT_GOSSIPSUB_MAX_INBOUND_DATA_LENGTH,
  DEFAULT_MAX_INBOUND_PUBSUB_QUEUE_SIZE,
  DEFAULT_MAX_INBOUND_PUBSUB_THROUGHPUT,
  DEFAULT_MAX_INBOUND_ROSENET_DIRECT_QUEUE_SIZE,
  DEFAULT_MAX_INBOUND_ROSENET_DIRECT_QUEUE_SIZE_PER_PEER,
  DEFAULT_MAX_INBOUND_ROSENET_DIRECT_THROUGHPUT,
  DEFAULT_MAX_INBOUND_ROSENET_DIRECT_THROUGHPUT_PER_PEER,
  DEFAULT_MAX_OUTBOUND_PUBSUB_QUEUE_SIZE,
  DEFAULT_MAX_OUTBOUND_PUBSUB_THROUGHPUT,
  DEFAULT_MAX_OUTBOUND_ROSENET_DIRECT_QUEUE_SIZE,
  DEFAULT_MAX_OUTBOUND_ROSENET_DIRECT_THROUGHPUT,
  DEFAULT_MESSAGE_HANDLING_TIMEOUT,
  DEFAULT_MESSAGE_RETRY_ATTEMPTS,
  DEFAULT_MESSAGE_RETRY_INITIAL_DELAY,
  DEFAULT_MESSAGE_ROUNDTRIP_TIMEOUT,
  DEFAULT_NODE_HOST,
  DEFAULT_NODE_PORT,
  DEFAULT_RELAYS_COUNT_TO_CONNECT,
  DEFAULT_ROSENET_DIRECT_STREAM_CREATION_TIMEOUT,
} from '../constants';

const RoseNetNodeContext = {
  logger: console as AbstractLogger,
  config: {} as RoseNetNodeConfig,
  init(config: PartialRoseNetNodeConfig) {
    const defaultConfig = {
      direct: {
        roundTripTimeout: DEFAULT_MESSAGE_ROUNDTRIP_TIMEOUT,
        handlingTimeout: DEFAULT_MESSAGE_HANDLING_TIMEOUT,
        maxRetryAttempts: DEFAULT_MESSAGE_RETRY_ATTEMPTS,
        failFastMaxRetryAttempts: DEFAULT_FAIL_FAST_MESSAGE_RETRY_ATTEMPTS,
        retryInitialDelay: DEFAULT_MESSAGE_RETRY_INITIAL_DELAY,
        failFastRetryInitialDelay:
          DEFAULT_FAIL_FAST_MESSAGE_RETRY_INITIAL_DELAY,
        maxInboundThroughput: DEFAULT_MAX_INBOUND_ROSENET_DIRECT_THROUGHPUT,
        maxInboundThroughputPerPeer:
          DEFAULT_MAX_INBOUND_ROSENET_DIRECT_THROUGHPUT_PER_PEER,
        maxInboundQueueSize: DEFAULT_MAX_INBOUND_ROSENET_DIRECT_QUEUE_SIZE,
        maxInboundQueueSizePerPeer:
          DEFAULT_MAX_INBOUND_ROSENET_DIRECT_QUEUE_SIZE_PER_PEER,
        maxOutboundThroughput: DEFAULT_MAX_OUTBOUND_ROSENET_DIRECT_THROUGHPUT,
        maxOutboundQueueSize: DEFAULT_MAX_OUTBOUND_ROSENET_DIRECT_QUEUE_SIZE,
        streamCreationTimeout: DEFAULT_ROSENET_DIRECT_STREAM_CREATION_TIMEOUT,
        failFastThreshold: DEFAULT_FAIL_FAST_THRESHOLD,
      },
      host: DEFAULT_NODE_HOST,
      port: DEFAULT_NODE_PORT,
      pubsub: {
        maxInboundThroughput: DEFAULT_MAX_INBOUND_PUBSUB_THROUGHPUT,
        maxInboundQueueSize: DEFAULT_MAX_INBOUND_PUBSUB_QUEUE_SIZE,
        maxOutboundThroughput: DEFAULT_MAX_OUTBOUND_PUBSUB_THROUGHPUT,
        maxOutboundQueueSize: DEFAULT_MAX_OUTBOUND_PUBSUB_QUEUE_SIZE,
        gossipsubMaxInboundDataLength:
          DEFAULT_GOSSIPSUB_MAX_INBOUND_DATA_LENGTH,
        gossipsubSignaturePolicy: 'StrictNoSign',
      },
      relay: {
        sampleSize: DEFAULT_RELAYS_COUNT_TO_CONNECT,
        multiaddrs: [],
      },
      logger: console,
      whitelist: [],
      debug: {
        libp2pComponents: [],
      },
    };
    this.config = merge(defaultConfig, config);
    this.logger = this.config.logger;
  },
};

export default RoseNetNodeContext;
