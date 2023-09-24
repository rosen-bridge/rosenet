import fs from 'fs';
import { toString as uint8ArrayToString } from 'uint8arrays/to-string';

import { PeerId } from '@libp2p/interface-peer-id';
import { createEd25519PeerId, createFromJSON } from '@libp2p/peer-id-factory';

/**
 * return PeerID or create PeerID if it doesn't exist
 *
 * @param peerIdFilePath
 */
const getOrCreatePeerID = async (
  peerIdFilePath: string
): Promise<{ peerId: PeerId; exist: boolean }> => {
  if (!fs.existsSync(peerIdFilePath)) {
    return {
      peerId: await createEd25519PeerId(),
      exist: false,
    } as const;
  } else {
    const jsonData: string = fs.readFileSync(peerIdFilePath, 'utf8');
    const peerIdDialerJson = await JSON.parse(jsonData);
    return {
      peerId: await createFromJSON(peerIdDialerJson),
      exist: true,
    };
  }
};

/**
 * Try to create a file and save peerId into that ff peer id file doesn't exist
 *
 * @param peerObj
 * @param peerIdFilePath
 */
const savePeerIdIfNeed = async (
  peerObj: { peerId: PeerId; exist: boolean },
  peerIdFilePath: string
): Promise<void> => {
  if (!peerObj.exist) {
    const peerId = peerObj.peerId;
    let privateKey: Uint8Array;
    let publicKey: Uint8Array;
    if (peerId.privateKey && peerId.publicKey) {
      privateKey = peerId.privateKey;
      publicKey = peerId.publicKey;
    } else throw Error('PrivateKey for p2p is required');

    const peerIdDialerJson = {
      id: peerId.toString(),
      privKey: uint8ArrayToString(privateKey, 'base64pad'),
      pubKey: uint8ArrayToString(publicKey, 'base64pad'),
    };
    const jsonData = JSON.stringify(peerIdDialerJson);
    fs.writeFile(peerIdFilePath, jsonData, 'utf8', function (err) {
      if (err) throw err;
      console.log('PeerId created!');
    });
  }
};

export { getOrCreatePeerID, savePeerIdIfNeed };
