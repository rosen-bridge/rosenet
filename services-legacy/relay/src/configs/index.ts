import nodeConfig from 'config';
import { ValidationError, array, number, object, string } from 'yup';

import { TransportOptions } from '@rosen-bridge/winston-logger';

import './extend-yup';

import {
  DEFAULT_LOG_LEVEL,
  DEFAULT_PEER_ID_FILE_PATH,
  DEFAULT_PORT,
} from '../constants';

/**
 * get all service configs or exit the process in case of invalid configs
 */
const getAllConfigs = () => {
  try {
    const allowedPeers = array(
      string()
        .multiaddr('allowedPeers')
        .required('allowedPeers should not contain a null or undefined value')
        .label('allowedPeers'),
    )
      .required()
      .min(1)
      .label('allowedPeers')
      .validateSync(nodeConfig.get<string[]>('allowedPeers'));

    const logs = array(
      object({
        type: string()
          .oneOf(['file', 'console'])
          .required()
          .label('logs[index].type'),
        path: string().path('logs[index].path').label('logs[index].path'),
        maxSize: string().label('logs[index].maxSize'),
        maxFiles: string().label('logs[index].maxFiles'),
        level: string()
          .required()
          .oneOf(['debug', 'info', 'warn', 'error'])
          .default(DEFAULT_LOG_LEVEL)
          .label('logs[index].level'),
      }),
    )
      .label('logs')
      .validateSync(nodeConfig.get<TransportOptions[]>('logs'));

    const peerIdFilePath = string()
      .required()
      .path('peerIdFilePath')
      .label('peerIdFilePath')
      .validateSync(
        nodeConfig.get<string>('peerIdFilePath') ?? DEFAULT_PEER_ID_FILE_PATH,
      );

    const port = number()
      .required()
      .port()
      .label('port')
      .validateSync(nodeConfig.get<number>('port') ?? DEFAULT_PORT);

    return {
      allowedPeers,
      logs,
      peerIdFilePath,
      port,
    };
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error(`ConfigError: ${error.message}`);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
};

const config = getAllConfigs();

export default config;
