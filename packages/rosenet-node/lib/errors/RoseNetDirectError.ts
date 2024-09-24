import RoseNetNodeError from './RoseNetNodeError';

export enum RoseNetDirectErrorType {
  Timeout = 'Timeout',
  InvalidAckChunks = 'InvalidAckChunks',
  InvalidAckByte = 'InvalidAckByte',
}

class RoseNetDirectError extends RoseNetNodeError {
  constructor(
    message: string,
    public type: RoseNetDirectErrorType,
  ) {
    super(message);
  }
}

export default RoseNetDirectError;
