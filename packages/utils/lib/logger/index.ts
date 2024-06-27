import { format as utilFormat } from 'node:util';

import { ComponentLogger, Logger } from '@libp2p/interface';
import { AbstractLogger, DummyLogger } from '@rosen-bridge/logger-interface';

import format from './format';

/**
 * convert AbstractLogger to a printf-friendly logger
 * @param name
 * @param logger
 * @param level
 */
const convertToPrintfFormat =
  (name: string, logger: AbstractLogger, level: 'info' | 'error' | 'debug') =>
  (formatter: unknown, ...rest: unknown[]) => {
    if (typeof formatter === 'string') {
      const formatted = format(formatter, ...rest);
      logger[level](`[${name}] ${formatted}`);
    } else {
      logger[level](`[${name}] ${utilFormat(formatter, ...rest)}`);
    }
  };

/**
 * create logger for a specific libp2p component
 * @param name
 * @param logger
 */
const createLogger = (name: string, logger: AbstractLogger): Logger => {
  const componentLogger = convertToPrintfFormat(name, logger, 'info') as Logger;
  componentLogger.trace = convertToPrintfFormat(name, logger, 'debug');
  componentLogger.error = convertToPrintfFormat(name, logger, 'error');
  componentLogger.enabled = true;

  return componentLogger;
};

/**
 * create a ComponentLogger to be used as alternative to default libp2p logger
 * @param logger
 * @param components
 */
const libp2pLoggerFactory: (
  logger: AbstractLogger,
  components: string[],
) => ComponentLogger = (logger: AbstractLogger, components: string[]) => ({
  forComponent(name: string) {
    if (components.includes(name) || components.includes('*')) {
      return createLogger(name, logger);
    }
    return createLogger('', new DummyLogger());
  },
});

export default libp2pLoggerFactory;
