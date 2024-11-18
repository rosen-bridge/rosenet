import { unmarshalPublicKey } from '@libp2p/crypto/keys';
import { createFromPubKey } from '@libp2p/peer-id-factory';

/**
 * convert a public key string to a PublicKey object
 * @param publicKey hex encoded public key in any of rsa, ed25519, or
 * secp256k1 formats
 */
const unmarshalPublicKeyString = (publicKey: string) =>
  unmarshalPublicKey(Buffer.from(publicKey, 'hex'));

/**
 * generate a peer id from a public key
 *
 * @param publicKey hex encoded public key in any of rsa, ed25519, or
 * secp256k1 formats
 */
const peerIdFromPublicKey = async (publicKey: string) => {
  const publicKeyObj = unmarshalPublicKeyString(publicKey);
  return await createFromPubKey(publicKeyObj);
};

export default peerIdFromPublicKey;
