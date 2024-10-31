import { InfluxDB, Point } from '@influxdata/influxdb-client';

import { serviceLogger } from './logger';

import config from './config';

const influxDB = new InfluxDB({
  url: 'http://influxdb:8086',
  token: config.influxdbToken,
});
const writeApi = influxDB.getWriteApi('Rosen', 'RoseNet');

/**
 * Save data about a direct message
 *
 * @param direction
 * @param status
 * @param peer
 * @param latency
 * @param size
 */
export const saveDirect = async (
  direction: 'send' | 'receive',
  status: 'success' | 'failure',
  peer: string,
  latency: number,
  size: number,
) => {
  try {
    const point = new Point('direct')
      .tag('direction', direction)
      .tag('status', status)
      .tag('peer', peer)
      .floatField('latency', latency)
      .uintField('size', size);

    writeApi.writePoint(point);
    await writeApi.flush();
    serviceLogger.debug('Direct message data saved in database');
  } catch (error) {
    serviceLogger.warn(
      'An error occurred while saving direct message data in database',
    );
    serviceLogger.debug(
      (error instanceof Error && error.message) || 'Unknown error message',
    );
  }
};

/**
 * Save data about a pubsub message
 *
 * @param direction
 * @param latency
 * @param size
 */
export const savePubsub = async (
  direction: 'send' | 'receive',
  latency: number,
  size: number,
) => {
  try {
    const point = new Point('pubsub')
      .tag('direction', direction)
      .floatField('latency', latency)
      .uintField('size', size);

    writeApi.writePoint(point);
    await writeApi.flush();
    serviceLogger.debug('Pubsub message data saved in database');
  } catch (error) {
    serviceLogger.warn(
      'An error occurred while saving pubsub message data in database',
    );
    serviceLogger.debug(
      (error instanceof Error && error.message) || 'Unknown error message',
    );
  }
};
