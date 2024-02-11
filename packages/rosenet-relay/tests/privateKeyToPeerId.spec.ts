import { describe, expect, it } from 'vitest';

import privateKeyToPeerId from '../lib/privateKeyToPeerId';

import { privateKeys, peerIds as expectedPeerIds } from './private-keys.data';

describe('privateKeyToPeerId', () => {
  /**
   * @target `privateKeyToPeerId` should convert convert all valid private key
   * types to peer id
   * @dependencies
   * @scenario
   * - generate peer ids for three different supported private keys
   * @expected
   * - peer ids should be correct
   */
  it('should convert convert all valid private key types to peer id', async () => {
    const actualPeerIds = {
      rsa: (await privateKeyToPeerId(privateKeys.rsa)).toString(),
      ed25519: (await privateKeyToPeerId(privateKeys.ed25519)).toString(),
      secp256k1: (await privateKeyToPeerId(privateKeys.secp256k1)).toString(),
    };

    expect(actualPeerIds).toEqual(expectedPeerIds);
  });

  /**
   * @target `privateKeyToPeerId` should throw if private key is not valid
   * @dependencies
   * @scenario
   * - try to generate a peer id for an invalid private key
   * @expected
   * - function call should throw an error
   */
  it('should throw if private key is not valid', () => {
    expect(async () => {
      await privateKeyToPeerId(privateKeys.invalid);
    }).rejects.toThrow();
  });
});
