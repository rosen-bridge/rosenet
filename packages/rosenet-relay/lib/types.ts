import { AbstractLogger } from '@rosen-bridge/logger-interface';

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
}
