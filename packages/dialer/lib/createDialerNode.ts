import {
  createRoseNetNode,
  PartialRoseNetNodeConfig,
} from '@rosen-bridge/rosenet-node';
import {
  ReceiveDataCommunication,
  SendDataCommunication,
  SubscribeChannel,
  SubscribeChannels,
  SubscribeChannelWithURL,
} from './types';
import { AbstractLogger, DummyLogger } from '@rosen-bridge/logger-interface';
import { DEFAULT_PUBSUB_TOPIC } from './constants';
import { groupBy } from 'lodash-es';
import JsonBigInt from '@rosen-bridge/json-bigint';

const createDialerNode = async (config: PartialRoseNetNodeConfig) => {
  const logger: AbstractLogger = config.logger
    ? (config.logger as AbstractLogger)
    : new DummyLogger();

  const _subscribedChannels: SubscribeChannels = {};
  const node = await createRoseNetNode(config);

  node.handleIncomingMessage(async (from: string, message?: string) => {
    handleIncomeMessage(from, message ?? '');
  });

  node.subscribe(DEFAULT_PUBSUB_TOPIC, (from: string, message: string) => {
    handleIncomeMessage(from, message);
  });

  const hasUrl = (
    channel: SubscribeChannel,
  ): channel is SubscribeChannelWithURL =>
    !!(channel as SubscribeChannelWithURL).url;

  /**
   * establish connection to relay
   * @param channel: string desire channel for subscription
   * @param callback: a callback function for subscribed channel
   * @param url: string for apiCallbackFunction
   */
  const subscribeChannel = (
    channel: string,
    callback: SubscribeChannel['func'],
    url?: string,
  ) => {
    const callbackObj = {
      func: callback,
      ...(url && { url }),
    } as SubscribeChannel;

    if (_subscribedChannels[channel]) {
      if (
        _subscribedChannels[channel].find(
          (sub) =>
            sub.func.name === callback.name &&
            ((hasUrl(sub) && sub.url === url) || !url),
        )
      ) {
        logger.info('A redundant subscribed channel detected.', {
          channel,
          url,
        });
        return;
      }
      _subscribedChannels[channel].push(callbackObj);
      logger.info(`Channel [${channel}] subscribed.`, {
        url,
      });
    } else {
      _subscribedChannels[channel] = [];
      _subscribedChannels[channel].push(callbackObj);
      logger.info(`Channel [${channel}] subscribed.`, {
        url,
      });
    }
  };

  /**
   * @return list of subscribed channels' name
   */
  const getSubscribedChannels = () => {
    return Object.keys(_subscribedChannels);
  };

  const runSubscribeCallback = async (
    channel: SubscribeChannel,
    receivedData: ReceiveDataCommunication,
    from: string,
  ) => {
    hasUrl(channel)
      ? channel.func(receivedData.msg, receivedData.channel, from, channel.url)
      : channel.func(receivedData.msg, receivedData.channel, from);
  };

  const handleIncomeMessage = async (from: string, message: string) => {
    try {
      const receivedData: ReceiveDataCommunication = JsonBigInt.parse(message);
      if (_subscribedChannels[receivedData.channel]) {
        logger.debug(
          `Received a message from [${from}] in subscribed channel [${receivedData.channel}].`,
        );
        _subscribedChannels[receivedData.channel].forEach((channel) => {
          runSubscribeCallback(channel, receivedData, from);
        });
      } else {
        logger.debug(
          `Received a message from [${from}] in unsubscribed channel [${receivedData.channel}].`,
        );
      }
    } catch (error) {
      logger.error(`An error occurred while handling stream callback`);
      if (error instanceof Error && error.stack) {
        logger.error(error.message);
        logger.error(error.stack);
      }
    }
  };

  /**
   * send message to specific peer or broadcast it
   * @param channel
   * @param msg
   * @param receiver optional
   */
  const sendMessage = async (
    channel: string,
    msg: string,
    receiver?: string,
  ) => {
    const data: SendDataCommunication = {
      msg: msg,
      channel: channel,
      ...(receiver && { receiver }),
    };
    const stringifyData = JSON.stringify(data);

    if (receiver) {
      node.sendMessage(receiver, stringifyData);
    } else {
      await node.publish(DEFAULT_PUBSUB_TOPIC, stringifyData);
    }
  };

  /**
   * @returns relay states grouped by the connection status
   */
  const getRelayStates = () => {
    const connectedPeers = node.info.getConnectedPeers();
    const relayStates = groupBy(node.info.relaysId, (peer) =>
      connectedPeers.includes(peer) ? 'connected' : 'notConnected',
    );
    return relayStates;
  };

  return {
    sendMessage: sendMessage,
    getSubscribedChannels: getSubscribedChannels,
    subscribeChannel: subscribeChannel,
    getRelayStates: getRelayStates,
    getDialerId: node.info.getPeerId,
    _node: node,
  };
};

export default createDialerNode;
