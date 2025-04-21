# @rosen-bridge/rosenet-utils

## 0.4.0

### Minor Changes

- Update logger package
- Add sign/verify messages in pubub protocol and add from field to subscribe handler

### Patch Changes

- Replace extensionless module resolution with tsx tool

## 0.3.0

### Minor Changes

- Refactor readPrivateKeyFromFile to read privKey with base64pad encoding

## 0.2.0

### Minor Changes

- Add `readPrivateKeyFromFile` utility function for the management of a RoseNet private key in a file

## 0.1.0

### Minor Changes

- Extract `privateKeyToPeerId` helper function into utils package
- Show only a diff log for update events in `addEventListeners`
- Add `libp2pLoggerFactory` for customizing libp2p logger
- Add `addEventListeners` function
