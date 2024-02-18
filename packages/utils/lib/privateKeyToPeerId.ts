import { unmarshalPrivateKey } from '@libp2p/crypto/keys';
import { createFromPrivKey } from '@libp2p/peer-id-factory';

/**
 * convert a private key string to a PrivateKey object
 * @param privateKey hex encoded private key in any of rsa, ed25519, or
 * secp256k1 formats
 */
const unmarshalPrivateKeyString = (privateKey: string) =>
  unmarshalPrivateKey(Buffer.from(privateKey, 'hex'));

/**
 * generate a peer id from a private key
 *
 * @param privateKey hex encoded private key in any of rsa, ed25519, or
 * secp256k1 formats
 */
const privateKeyToPeerId = async (privateKey: string) => {
  const privateKeyObj = await unmarshalPrivateKeyString(privateKey);
  const peerId = await createFromPrivKey(privateKeyObj);

  return peerId;
};

export default privateKeyToPeerId;
