import { DefaultLoggerFactory } from '@rosen-bridge/abstract-logger';
import WinstonLogger from '@rosen-bridge/winston-logger';

const winstonLogger = new WinstonLogger([
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

DefaultLoggerFactory.init(winstonLogger);
