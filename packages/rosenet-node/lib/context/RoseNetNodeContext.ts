import { AbstractLogger } from '@rosen-bridge/logger-interface';

const RoseNetNodeContext = {
  logger: console as AbstractLogger,
  init(logger: AbstractLogger) {
    this.logger = logger;
  },
};

export default RoseNetNodeContext;
