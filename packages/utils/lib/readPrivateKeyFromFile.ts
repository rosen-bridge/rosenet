import { generateKeyPair, marshalPrivateKey } from '@libp2p/crypto/keys';
import { readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';
import {
  fromString as uint8ArrayFromString,
  toString as uint8ArrayToString,
} from 'uint8arrays';

/**
 * read private key from a file and return its string representation, creating
 * the file with a random private key if it doesn't exist
 * @param path relative or absolute path to the file
 */
const readPrivateKeyFromFile = async (path: string) => {
  const fullPath = resolve(path);
  try {
    const fileData = await readFile(fullPath, 'utf-8');
    const nodeDataJson = JSON.parse(fileData);
    const privKeyUint8Array = uint8ArrayFromString(
      nodeDataJson.privKey,
      'base64pad',
    );
    return Buffer.from(privKeyUint8Array).toString('hex');
  } catch (error) {
    const privateKey = await generateKeyPair('Ed25519');
    const marshalPrivKey = marshalPrivateKey(privateKey);
    const privateKeyString = uint8ArrayToString(marshalPrivKey, 'base64pad');
    const nodeDataJson = {
      privKey: privateKeyString,
    };
    await writeFile(fullPath, JSON.stringify(nodeDataJson), 'utf-8');

    return Buffer.from(marshalPrivKey).toString('hex');
  }
};

export default readPrivateKeyFromFile;
