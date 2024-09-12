# RoseNet Direct v1

| Status | creation date | last update date | version |
| ------ | ------------- | ---------------- | ------- |
| Draft  | 11 Sep 2024   | 11 Sep 2024      | Draft-1 |

Author: @mkermani144  
Contributors: N/A

# RoseNet Direct v1 Protocol Specification

## Protocol ID

`/rosenet/direct/1`

## Overview

RoseNet Direct v1 is the messaging protocol used in RoseNet for sending messages to a specific peer in the RoseNet network. It implements a basic acknowledgment mechanism.

## Message Flow

1. The dialing peer sends a message of arbitrary size to the listening peer.
2. After the message is fully transmitted, the dialing peer waits for an acknowledgment from the listening peer.
3. The listening peer sends a single byte with the value `1` as an acknowledgment.
4. If the dialing peer receives any response other than a single byte with the value `1`, it MUST treat this as an error condition.

## Detailed Behavior

### Dialing Peer

1. MUST establish a connection to the listening peer using the RoseNet network.
2. MUST send the entire message as a single, uninterrupted transmission.
3. MUST wait for an acknowledgment after sending the complete message.
4. MUST treat any response other than a single `1` byte as an error.
5. SHOULD implement a timeout mechanism for waiting for the acknowledgment.

### Listening Peer

1. MUST accept incoming connections for this protocol.
2. MUST receive the entire message before sending an acknowledgment.
3. MUST send a single byte with the value `1` as an acknowledgment immediately after receiving the complete message.
4. MUST NOT send any other data as part of the acknowledgment.

### Error Handling

1. If the dialing peer receives an unexpected response, it SHOULD close the stream and MAY attempt to retransmit the message.
1. If the listening peer encounters any errors while receiving the message, it SHOULD close the stream without sending an acknowledgment.
