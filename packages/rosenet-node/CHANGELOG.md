# @rosen-bridge/rosenet-node

## 0.3.1

### Patch Changes

- Update package license to MIT
- Update dependencies
  - @rosen-bridge/rosenet-utils@0.4.1

## 0.3.0

### Minor Changes

- Export the requirements of the dialer package and add the excludeRelays flag for the node’s connections
- Update logger package
- Add sign/verify messages in pubub protocol and add from field to subscribe handler

### Patch Changes

- Fix the address-service to return IPv4. The publicIp package automatically returns IPv6, which will cause issues on most networks.
- Replace extensionless module resolution with tsx tool
- Update dependencies
  - @rosen-bridge/rosenet-utils@0.4.0

## 0.2.1

### Patch Changes

- Update dependencies
  - @rosen-bridge/rosenet-utils@0.3.0

## 0.2.0

### Minor Changes

- Add `getDiscoveredPeers` to public APIs for gettting a list of discovered peer ids

### Patch Changes

- Change level of peer id log to info
- Fix failing dials when nodes are behind a non-symmetric NAT
- Update dependencies
  - @rosen-bridge/rosenet-utils@0.2.0

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
