/**
 * create an infinite, never ending, FIFO async iterable that can be pushed into
 * after consumption
 */
const createPushable = <T>(): Pushable<T> => {
  const iterable: T[] = [];

  let resolveLastYield: () => void | undefined;

  return {
    async *[Symbol.asyncIterator](): AsyncGenerator<T, never, unknown> {
      while (true) {
        /**
         * if there is any item in the iterable, yield it, otherwise wait for such
         * an item to be pushed and yield it immediately
         */
        if (iterable.length) {
          yield Promise.resolve(iterable.shift()!);
        } else {
          yield new Promise((resolve: (value: T) => void) => {
            resolveLastYield = () => {
              resolve(iterable.shift()!);
            };
          });
        }
      }
    },
    push: (value: T) => {
      iterable.push(value);
      if (iterable.length === 1) {
        resolveLastYield?.();
      }
    },
  };
};

export interface Pushable<T> extends AsyncIterable<T> {
  push: (value: T) => void;
}

export default createPushable;
