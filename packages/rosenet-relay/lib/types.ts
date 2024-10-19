import { AbstractLogger } from '@rosen-bridge/logger-interface';
import { SignaturePolicy } from '@libp2p/interface';

export interface RoseNetRelayConfig {
  listen?: {
    host?: string;
    port?: number;
  };
  privateKey: string;
  logger: AbstractLogger;
  whitelist: string[];
  maxReservations?: number;
  debug?: {
    libp2pComponents?: string[];
  };
  pubsub?: {
    gossipsubMaxInboundDataLength?: number;
    gossipsubSignaturePolicy?: SignaturePolicy;
  };
}
