# @rosen-bridge/rosenet-relay

## 0.1.0

### Minor Changes

- Enforce passing a private key to create a RoseNet relay
- Add whitelist support
- Limit node connections to relay to 3 to prevent network traffic issues
- Add `subscribe` function for subscribing to a pubsub topic
- Add pubsub related configs
- Add node info containing type (node vs relay) and version
- Enable gossipsub peer exchange in relays
- Add peer discovery mechanism
- Configure relays as Gossipsub bootstrappers
- Enable DCUtR service
- Add pubsub apis
- Log different libp2p node events
- Add config to enable libp2p logs
- Prevent applying default reservation limits
- Prevent Gossipsub from running on transient connections
