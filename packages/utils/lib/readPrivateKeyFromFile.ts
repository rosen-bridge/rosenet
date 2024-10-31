import { generateKeyPair, marshalPrivateKey } from '@libp2p/crypto/keys';
import { readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';

/**
 * read private key from a file and return its string representation, creating
 * the file with a random private key if it doesn't exist
 * @param path relative or absolute path to the file
 */
const readPrivateKeyFromFile = async (path: string) => {
  const fullPath = resolve(path);
  try {
    return await readFile(fullPath, 'utf-8');
  } catch (error) {
    const privateKey = await generateKeyPair('Ed25519');
    const privateKeyString = Buffer.from(
      marshalPrivateKey(privateKey),
    ).toString('hex');

    await writeFile(fullPath, privateKeyString, 'utf-8');

    return privateKeyString;
  }
};

export default readPrivateKeyFromFile;
