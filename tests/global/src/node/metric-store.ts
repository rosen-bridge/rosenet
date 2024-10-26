import { InfluxDB, Point } from '@influxdata/influxdb-client';

import logger from './logger';

const influxDB = new InfluxDB({
  url: 'http://influxdb:8086',
  token: 'helloworld',
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
  } catch {
    logger.warn(
      'An error occurred while saving direct message data in database',
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
  } catch {
    logger.warn(
      'An error occurred while saving pubsub message data in database',
    );
  }
};
