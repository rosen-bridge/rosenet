import { AbstractLogger } from '@rosen-bridge/logger-interface';

const RoseNetNodeTools = {
  logger: console as AbstractLogger,
  init(logger: AbstractLogger) {
    this.logger = logger;
  },
};

export default RoseNetNodeTools;
