import { DefaultLogger } from '@rosen-bridge/abstract-logger';
import WinstonLogger from '@rosen-bridge/winston-logger';

const winstonLogger = WinstonLogger.createLogger([
  {
    type: 'console',
    level: 'info',
  },
  {
    type: 'file',
    level: 'info',
    maxFiles: '10',
    maxSize: '20m',
    path: './logs/info/',
  },
  {
    type: 'file',
    level: 'debug',
    maxFiles: '100',
    maxSize: '20m',
    path: './logs/debug/',
  },
]);

DefaultLogger.init(winstonLogger);
