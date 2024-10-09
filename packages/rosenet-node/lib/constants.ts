/**
 * How many relays to search for and connect to
 */
export const RELAYS_COUNT_TO_CONNECT = 3;
/**
 * Minimum relays count below which we try to connect new relays
 */
export const MIN_RELAYS = 2;
/**
 * Interval for restarting relay discovery to check if MIN_RELAYS threshold is
 * reached
 */
export const RELAY_DISCOVERY_RESTART_INTERVAL = 10_000;
/**
 * RoseNet protocol id
 */
export const ROSENET_DIRECT_PROTOCOL_V1 = '/rosenet/direct/1';
/**
 * Default port in which libp2p node will listen to
 */
export const DEFAULT_NODE_PORT = 55123;
/**
 * A single byte that we wait to receive as an acknowledgement of successful
 * message reception
 */
export const ACK_BYTE = 1;
/**
 * Maximum time that sending a message (writing bytes and receiving ack) can
 * take
 */
export const MESSAGE_ROUNDTRIP_TIMEOUT = 5000;
/**
 * Maximum time that handling an incoming RoseNet Direct can take (calling
 * handler and writing ack byte)
 */
export const MESSAGE_HANDLING_TIMEOUT = 2000;
/**
 * The number of times we attempt to re-send failed messages
 */
export const MESSAGE_RETRY_ATTEMPTS = 5;
/**
 * The number of times we attempt to re-send failed messages when in fail fast
 * mode
 */
export const FAIL_FAST_MESSAGE_RETRY_ATTEMPTS = 1;
/**
 * Initial delay after which we retry sending a failed message
 */
export const MESSAGE_RETRY_INITIAL_DELAY = 2000;
/**
 * Initial delay after which we retry sending a failed message when in fail fast
 * mode
 */
export const FAIL_FAST_MESSAGE_RETRY_INITIAL_DELAY = 5000;
/**
 * Maximum number of incoming RoseNet Direct messages that can be handled
 * concurrently
 */
export const MAX_INBOUND_ROSENET_DIRECT_THROUGHPUT = 100;
/**
 * Maximum number of incoming RoseNet Direct messages that can be queued if
 * throughput threshold is reached
 */
export const MAX_INBOUND_ROSENET_DIRECT_QUEUE_SIZE = 200;
/**
 * Maximum number of incoming RoseNet Direct messages from a single peer that
 * can be handled concurrently
 */
export const MAX_INBOUND_ROSENET_DIRECT_THROUGHPUT_PER_PEER = 10;
/**
 * Maximum number of incoming RoseNet Direct messages from a single peer that
 * can be queued if throughput threshold is reached
 */
export const MAX_INBOUND_ROSENET_DIRECT_QUEUE_SIZE_PER_PEER = 20;
/**
 * Maximum number of outgoing RoseNet Direct messages that can be sent
 * concurrently
 */
export const MAX_OUTBOUND_ROSENET_DIRECT_THROUGHPUT = 200;
/**
 * Maximum number of outgoing RoseNet Direct messages that can queued if
 * throughput threshold is reached
 */
export const MAX_OUTBOUND_ROSENET_DIRECT_QUEUE_SIZE = 400;
/**
 * Maximum number of incoming pubsub messages that can be handled concurrently
 */
export const MAX_INBOUND_PUBSUB_THROUGHPUT = 100;
/**
 * Maximum number of incoming pubsub messages that can be queued if throughput
 * threshold is reached
 */
export const MAX_INBOUND_PUBSUB_QUEUE_SIZE = 200;
/**
 * Maximum number of outgoing pubsub messages that can be sent concurrently
 */
export const MAX_OUTBOUND_PUBSUB_THROUGHPUT = 200;
/**
 * Maximum number of outgoing pubsub messages that can queued if throughput
 * threshold is reached
 */
export const MAX_OUTBOUND_PUBSUB_QUEUE_SIZE = 400;
/**
 * Maximum time that creation of a stream (including protocol negotiations and
 * upgrade) can take
 */
export const ROSENET_DIRECT_STREAM_CREATION_TIMEOUT = 2000;
/**
 * Threshold for enabling fail fast when sending messages, resulting in fewer
 * retry attempts to prevent the queues from becoming full
 */
export const FAIL_FAST_THRESHOLD = MAX_OUTBOUND_ROSENET_DIRECT_THROUGHPUT / 4;
