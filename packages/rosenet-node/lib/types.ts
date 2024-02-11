import { AbstractLogger } from '@rosen-bridge/logger-interface';

export interface RoseNetNodeConfig {
  relayMultiaddrs: string[];
  logger: AbstractLogger;
}
