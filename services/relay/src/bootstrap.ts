import { CallbackLoggerFactory } from '@rosen-bridge/callback-logger';
import WinstonLogger from '@rosen-bridge/winston-logger';

import { logs } from './configs';

CallbackLoggerFactory.init(new WinstonLogger(logs));
