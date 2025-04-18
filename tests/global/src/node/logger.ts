import { CallbackLoggerFactory } from '@rosen-bridge/callback-logger';

export const serviceLogger =
  CallbackLoggerFactory.getInstance().getLogger('service');
export const rosenetLogger =
  CallbackLoggerFactory.getInstance().getLogger('rosenet');
