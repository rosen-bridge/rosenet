# @rosen-bridge/rosenet-node

## 0.1.0

### Minor Changes

- Add required `privateKey` config for creating peer id
- Implement ack mechanism for direct messages
- Disable gossipsub signing
- Retry failed direct messages
- Add required configurations to node factory
- Add pubsub limits
- Limit the number of concurrent pending messages, while also applying different timeouts during message sending
- Limit node connections to relay to 3 to prevent network traffic issues
- Add whitelist support
- Add node info containing type (node vs relay) and version
- Implement basic messaging apis
- Add peer discovery mechanism
- Limit the number of concurrent messages that can be handled concurrently
- Enable DCUtR service
- Add pubsub apis
- Log different libp2p node events
- Add info APIs
- Add config to enable libp2p logs
- Enable fail fast when message sending bulkhead execution slots becomes nearly full
- Add timeout for handling incoming direct messages
- Announce public ip
- Prevent Gossipsub from running on transient connections
