class RoseNetNodeError extends Error {
  constructor(
    public message: string,
    public stack = '',
    cause?: unknown,
  ) {
    super(message);

    this.cause = cause;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default RoseNetNodeError;
