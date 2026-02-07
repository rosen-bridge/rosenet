import { DefaultLogger } from '@rosen-bridge/abstract-logger';

export const serviceLogger = DefaultLogger.getInstance().child('service');
export const rosenetLogger = DefaultLogger.getInstance().child('rosenet');
