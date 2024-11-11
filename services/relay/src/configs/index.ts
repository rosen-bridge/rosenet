import { TransportOptions } from '@rosen-bridge/winston-logger';
import config from 'config';

export const host = config.get<string>('listen.host') ?? '0.0.0.0';
export const port = config.get<number>('listen.port') ?? 44123;

export const whitelist = config.get<string[]>('whitelist') ?? [];

export const pubsubTopics = config.get<string[]>('pubsubTopics') ?? [];

export const logs = config.get<TransportOptions[]>('logs') ?? [];

export const privateKeyFilePath =
  config.get<string>('privateKeyFilePath') ?? './rosenet-secret.json';
