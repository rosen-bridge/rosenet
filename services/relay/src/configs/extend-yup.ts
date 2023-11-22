import { addMethod, number, string } from 'yup';
import isValidPath from 'is-valid-path';

import { isMultiaddr, multiaddr } from '@multiformats/multiaddr';

declare module 'yup' {
  interface StringSchema {
    multiaddr(fieldName: string): this;
    path(fieldName: string): this;
  }
  interface NumberSchema {
    port(): this;
  }
}

addMethod(string, 'multiaddr', function validateMultiaddr(fieldName: string) {
  return this.test(
    'multiaddr',
    '"${value}" is not a multiaddr',
    (str, context) => {
      try {
        if (!str) return true;
        return isMultiaddr(multiaddr(str));
      } catch {
        return context.createError({
          params: {
            label: fieldName,
          },
        });
      }
    }
  );
});

addMethod(string, 'path', function validatePath(fieldName: string) {
  return this.test('path', '"${value}" is not a path', (str, context) => {
    try {
      if (!str) return true;
      return isValidPath(str);
    } catch {
      return context.createError({
        params: {
          label: fieldName,
        },
      });
    }
  });
});

addMethod(number, 'port', function validatePort() {
  // The provided numbers are standard server ports range
  return this.min(1024).max(49151);
});
