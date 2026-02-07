import { DefaultLogger } from '@rosen-bridge/abstract-logger';
import WinstonLogger from '@rosen-bridge/winston-logger';
import CallbackLogger from '@rosen-bridge/callback-logger';

import { logs } from './configs';

DefaultLogger.init(new CallbackLogger(WinstonLogger.createLogger(logs)));
