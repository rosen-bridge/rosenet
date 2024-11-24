import createDialerNode from './createDialerNode';

interface SubscribeChannelWithURL {
  func: (msg: string, channel: string, sender: string, url: string) => void;
  url: string;
}
interface SubscribeChannelWithoutURL {
  func: (msg: string, channel: string, sender?: string) => void;
}
type SubscribeChannel = SubscribeChannelWithURL | SubscribeChannelWithoutURL;

interface SubscribeChannels {
  [id: string]: Array<SubscribeChannel>;
}

interface SendDataCommunication {
  msg: string;
  channel: string;
  receiver?: string;
}

interface ReceiveDataCommunication {
  msg: string;
  channel: string;
  receiver?: string;
}

type RosenDialerNode = Awaited<ReturnType<typeof createDialerNode>>;

export {
  RosenDialerNode,
  SubscribeChannels,
  SubscribeChannelWithURL,
  SubscribeChannelWithoutURL,
  SubscribeChannel,
  SendDataCommunication,
  ReceiveDataCommunication,
};
