export const RELAYS_COUNT_TO_CONNECT = 3;
export const MIN_RELAYS = 2;
export const RELAY_DISCOVERY_RESTART_INTERVAL = 10_000;
export const ROSENET_DIRECT_PROTOCOL_V1 = '/rosenet/direct/1';
export const DEFAULT_NODE_PORT = 55123;
export const ACK_BYTE = 1;
/**
 * Worst inter-continent ping RTT is around 250ms at the time of this commit,
 * and an ack requires 1 RTT. We use 2 RTT as the timeout for an ack.
 */
export const ACK_TIMEOUT = 500;
