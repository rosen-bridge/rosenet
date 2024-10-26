const optional = (value: string | undefined, fallbackValue: number) =>
  value ? +value : fallbackValue;

export default {
  shouldSendDirectToOldPeers:
    process.env.SHOULD_SEND_DIRECT_TO_OLD_PEERS === 'true',
  directBurstSize: optional(process.env.DIRECT_BURST_SIZE, 100),
  pubsubBurstSize: optional(process.env.PUBSUB_BURST_SIZE, 10),
  minIdleTime: optional(process.env.MIN_IDLE_TIME, 5),
  maxIdleTime: optional(process.env.MAX_IDLE_TIME, 10_000),
  minMessageSize: optional(process.env.MIN_MESSAGE_SIZE, 10_000),
  maxMessageSize: optional(process.env.MAX_MESSAGE_SIZE, 500_000),
  minScenarioDuration: optional(process.env.MIN_SCNEARIO_DURATION, 60_000),
  maxScenarioDuration: optional(process.env.MAX_SCNEARIO_DURATION, 300_000),
  relayMultiaddrs: process.env.RELAY_MULTIADDRS!.split(','),
};
