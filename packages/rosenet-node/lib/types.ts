import { SignaturePolicy } from '@libp2p/interface';
import { AbstractLogger } from '@rosen-bridge/logger-interface';

export interface RoseNetNodeConfig {
  privateKey: string;
  logger: AbstractLogger;
  port: number;
  host: string;
  whitelist: string[];
  debug: {
    libp2pComponents: string[];
  };
  relay: {
    multiaddrs: string[];
    sampleSize: number;
  };
  direct: {
    roundTripTimeout: number;
    handlingTimeout: number;
    maxRetryAttempts: number;
    failFastMaxRetryAttempts: number;
    retryInitialDelay: number;
    failFastRetryInitialDelay: number;
    maxInboundThroughput: number;
    maxInboundThroughputPerPeer: number;
    maxInboundQueueSize: number;
    maxInboundQueueSizePerPeer: number;
    maxOutboundThroughput: number;
    maxOutboundQueueSize: number;
    streamCreationTimeout: number;
    failFastThreshold: number;
  };
  pubsub: {
    maxInboundThroughput: number;
    maxInboundQueueSize: number;
    maxOutboundThroughput: number;
    maxOutboundQueueSize: number;
    gossipsubMaxInboundDataLength: number;
    gossipsubSignaturePolicy: SignaturePolicy;
  };
}

type RecursivePartial<T> = {
  [P in keyof T]?: RecursivePartial<T[P]>;
};

type RoseNetNodeConfigMandatoryKeys = 'privateKey';
export type PartialRoseNetNodeConfig = Pick<
  RoseNetNodeConfig,
  RoseNetNodeConfigMandatoryKeys
> &
  RecursivePartial<Omit<RoseNetNodeConfig, RoseNetNodeConfigMandatoryKeys>>;
