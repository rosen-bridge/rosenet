import { unmarshalPrivateKey, unmarshalPublicKey } from '@libp2p/crypto/keys';
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string';
import { toString as uint8ArrayToString } from 'uint8arrays/to-string';

/**
 * sign data using provided private key
 * @param privKeyBytes
 * @param data
 */
const sign = async (privKeyBytes: Uint8Array, data: string) => {
  const privKey = await unmarshalPrivateKey(privKeyBytes);
  const signature = await privKey.sign(uint8ArrayFromString(data, 'utf-8'));
  return uint8ArrayToString(signature, 'hex');
};

/**
 * verify data using publicKey and provided signature
 * @param pubKeyBytes
 * @param data
 * @param signature
 */
const verify = async (pubKeyBytes: string, data: string, signature: string) => {
  const pubKey = unmarshalPublicKey(Buffer.from(pubKeyBytes, 'hex'));
  return pubKey.verify(
    uint8ArrayFromString(data, 'utf-8'),
    uint8ArrayFromString(signature, 'hex'),
  );
};

export default { sign, verify };
