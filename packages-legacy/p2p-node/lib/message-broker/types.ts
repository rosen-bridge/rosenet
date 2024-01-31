import { Message } from '../types';

export interface MessageBrokerOptions {
  maxRetries: number;
  exponentialFactor: number;
}

export interface WrappedMessage {
  retries: bigint;
  message: Message;
}
