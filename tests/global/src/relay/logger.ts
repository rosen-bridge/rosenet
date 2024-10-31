import { DefaultLoggerFactory } from '@rosen-bridge/abstract-logger';

export const serviceLogger =
  DefaultLoggerFactory.getInstance().getLogger('service');
export const rosenetLogger =
  DefaultLoggerFactory.getInstance().getLogger('rosenet');
