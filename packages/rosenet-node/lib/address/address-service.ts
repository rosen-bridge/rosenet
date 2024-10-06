import { isIP } from 'node:net';

import { fromNodeAddress } from '@multiformats/multiaddr';
import { publicIp } from 'public-ip';

import RoseNetNodeContext from '../context/RoseNetNodeContext';

/**
 * identify public ip (v4 or v6) of current node
 */
const identifyPublicIP = () => publicIp();

/**
 * get multiaddr containing public ip of current node, to be used as announce
 * address
 */
const getAnnounceMultiaddr = async (port: number) => {
  const ip = await identifyPublicIP();
  RoseNetNodeContext.logger.debug(`Public ip identified: ${ip}`);
  const ipVersion = isIP(ip);

  const multiaddr = fromNodeAddress(
    { address: ip, family: ipVersion as 4 | 6, port },
    'tcp',
  );

  return multiaddr.toString();
};

export default {
  getAnnounceMultiaddr,
};
