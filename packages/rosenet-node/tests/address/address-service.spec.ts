import { describe, expect, it, vi } from 'vitest';

import addressService from '../../lib/address/address-service';

const fakePublicIP = vi.hoisted(() => '172.20.20.20');
const fakePort = 12345;

vi.mock('public-ip', () => ({
  publicIp: vi.fn().mockResolvedValue(fakePublicIP),
}));

describe('getAnnounceMultiaddr', () => {
  /**
   * @target
   * getAnnounceMultiaddr should get announce multiaddr
   * @dependencies
   * - `public-ip` package
   * @scenario
   * - call the function
   * @expected
   * - announceMultiaddr should be the correct one
   */
  it('should get announce multiaddr', async () => {
    const announceMultiaddr =
      await addressService.getAnnounceMultiaddr(fakePort);

    expect(announceMultiaddr).toEqual(`/ip4/${fakePublicIP}/tcp/${fakePort}`);
  });
});
