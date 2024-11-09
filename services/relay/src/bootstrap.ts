import { DefaultLoggerFactory } from '@rosen-bridge/abstract-logger';
import WinstonLogger from '@rosen-bridge/winston-logger';

import { logs } from './configs';

const winston = new WinstonLogger(logs);
DefaultLoggerFactory.init(winston);
