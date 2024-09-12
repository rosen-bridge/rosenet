import RoseNetNodeError from './RoseNetNodeError';

export enum AckError {
  Timeout = 'Timeout',
  InvalidChunks = 'InvalidChunks',
  InvalidByte = 'InvalidByte',
}

class RoseNetDirectAckError extends RoseNetNodeError {
  constructor(
    message: string,
    public type: AckError,
  ) {
    super(message);
  }
}

export default RoseNetDirectAckError;
