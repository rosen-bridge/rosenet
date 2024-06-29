import { format as utilFormat } from 'node:util';

import { PeerId } from '@libp2p/interface';
import { Multiaddr } from '@multiformats/multiaddr';
import { Key } from 'interface-datastore';
import { base32 } from 'multiformats/bases/base32';
import { base58btc } from 'multiformats/bases/base58';
import { base64 } from 'multiformats/bases/base64';
import { CID } from 'multiformats/cid';

// based on https://github.com/libp2p/js-libp2p/blob/3c73707ff5c1635d4ab26dcc39499ab497d217a6/packages/logger/src/index.ts#L45
const formatters = {
  b: (v?: Uint8Array) => {
    return v == null ? 'undefined' : base58btc.baseEncode(v);
  },
  t: (v?: Uint8Array) => {
    return v == null ? 'undefined' : base32.baseEncode(v);
  },
  m: (v?: Uint8Array) => {
    return v == null ? 'undefined' : base64.baseEncode(v);
  },
  p: (v?: PeerId) => {
    return v == null ? 'undefined' : v.toString();
  },
  c: (v?: CID) => {
    return v == null ? 'undefined' : v.toString();
  },
  k: (v: Key) => {
    return v == null ? 'undefined' : v.toString();
  },
  a: (v?: Multiaddr) => {
    return v == null ? 'undefined' : v.toString();
  },
};

/**
 * format a string like `util.format`, but support custom libp2p specifiers, too
 * based on https://github.com/segmentio/fmt
 * @param str
 * @param args
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const format = (str: string, ...args: any[]) => {
  let j = 0;

  const formatted = str.replace(
    /%([a-z])/gi,
    (match, f: keyof typeof formatters) => {
      if (formatters[f]) {
        return formatters[f](args[j++]);
      }
      if (f) {
        return utilFormat(`%${f}`, args[j++]);
      }
      return match;
    },
  );
  return `${formatted} ${args.slice(j).join(' ')}`.trimEnd();
};

export default format;
