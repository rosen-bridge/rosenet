class RoseNetNodeError extends Error {
  constructor(
    public message: string,
    public stack = '',
  ) {
    super(message);

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default RoseNetNodeError;
