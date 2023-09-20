import { Connection, Stream } from '@libp2p/interface-connection';

export interface SubscribeChannelWithURL {
  func: (msg: string, channel: string, sender: string, url: string) => void;
  url: string;
}
export interface SubscribeChannelWithoutURL {
  func: (msg: string, channel: string, sender: string) => void;
}
export type SubscribeChannel =
  | SubscribeChannelWithURL
  | SubscribeChannelWithoutURL;

export interface SubscribeChannels {
  [id: string]: Array<SubscribeChannel>;
}

export interface SendDataCommunication {
  msg: string;
  channel: string;
  receiver?: string;
}

export interface ReceiveDataCommunication {
  msg: string;
  channel: string;
  receiver?: string;
}

export interface ConnectionStream {
  connection: Connection;
  stream: Stream;
}

export interface RelayInfo {
  peerId: string;
  address: string;
}

export interface P2PNodeConfig {
  allowedStreamsPerGuard: number;
  apiCallbackTimeout: number;
  bootstrapTimeout: number;
  guardsCount: number;
  loggingInterval: number;
  messageSendingRetriesExponentialFactor: number;
  messageSendingRetriesMaxCount: bigint;
  peerIdFilePath: string;
  protocolName: string;
  pubsubInterval: number;
  relayReconnectionInterval: number;
  relays: { multiaddrs: string[]; peerIDs: string[] };
}
