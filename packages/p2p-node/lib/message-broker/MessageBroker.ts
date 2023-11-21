import { pushable } from 'it-pushable';

import { AbstractLogger } from '@rosen-bridge/logger-interface';

import MessageRetryHelper from './MessageRetryHelper';

import { MessageBrokerOptions } from './types';
import { Message } from '../types';

class MessageBroker extends MessageRetryHelper {
  private queue = pushable();

  constructor(options: MessageBrokerOptions, logger: AbstractLogger) {
    super(options, logger);
    logger.debug('MessageBroker instantiated');
  }

  /**
   * enqueue a message
   * @param message
   */
  enqueue = (message: Message) => {
    const wrappedMessage = this.wrapMessage(message, 0);
    this.queue.push(wrappedMessage);
    this.logger.debug('new message enqueued', { message });
  };

  /**
   * start routing messages, sending them to their corresponding targets and
   * retrying in case of failure
   * @param route
   */
  startRouting = async (route: (message: Message) => Promise<unknown>) => {
    this.logger.info('message routing started');
    for await (const wrappedMessage of this.queue) {
      try {
        const { message } = this.unwrapMessage(wrappedMessage);
        await route(message);
        this.logger.debug('message sent successfully', { message });
      } catch (error) {
        this.logger.debug('failed to send message', wrappedMessage);
        this.retryRouting(wrappedMessage, this.queue.push);
      }
    }
  };
}

export default MessageBroker;
