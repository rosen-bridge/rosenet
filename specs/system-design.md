# RoseNet System Design Spec

## Introduction

RoseNet, a decentralized p2p protocol empowering Rosen Bridge guards, aims to
provide a secure and reliable communication network. This document outlines the
design principles, assumptions, and features of RoseNet.

| Status | creation date | last update date | version |
| ------ | ------------- | ---------------- | ------- |
| Draft  | 25 Dec 2023   | 25 Dec 2023      | Draft-1 |

Author: @mkermani144  
Contributors: N/A

## Overview

RoseNet serves as a critical component in enabling secure communication between
Rosen Bridge guards. This section provides a high-level overview of RoseNet's
purpose and its role within the broader system.

_TODO: RoseNet use case in guards_

## RoseNet in action

The current RoseNet implementation utilizes libp2p internally. Before delving
into the system design specifics, let's establish a comprehensive understanding
of RoseNet's functionality.

In RoseNet, there are two distinct node types: Normal nodes (referred to as
"nodes" in this document) and relays. The conceptual framework mirrors that of
libp2p, wherein, to facilitate communication between two nodes, a well-known,
public intermediary called a relay is essential. This relay efficiently relays
traffic between the communicating nodes.

For a clearer grasp of RoseNet's operation, consider the following example
involving NodeA connecting to RoseNet through RelayR:

1. Following minimal configurations, particularly defining the RelayR
   multiaddress, NodeA attempts to establish a connection with RelayR.
2. If NodeA lacks whitelisting in RelayR, the connection remains unestablished,
   and NodeA cannot join RoseNet.
3. Upon NodeA's successful whitelisting in RelayR and subsequent connection to
   RelayR, it initiates the dissemination of its multiaddress across RoseNet.
   This dissemination employs a gossip-based protocol within libp2p, although
   specific details are not a focal point in this document. The key takeaway is
   that, over time, every node becomes aware of NodeA's presence in RoseNet,
   enabling the exchange of messages—NodeA can both send and receive messages
   seamlessly.
4. _TODO: messaging_

## ZeroLayer vs RoseLayer

_TODO_

## Features Summary

| Feature                 | Current State                                           |
| ----------------------- | ------------------------------------------------------- |
| Topology (ZeroLayer)    | Starts as a star, upgrades to partially-connected mesh  |
| Topology (RoseLayer)    | Gossip-based partially-connected mesh                   |
| Message Delivery        | Guaranteed within a 5-minute latency window             |
| Communication Security  | All messages are end-to-end encrypted                   |
| Sybil Attack Mitigation | Relays only accept connections from whitelisted nodes   |
| Network Availability    | At least 60% of the network is expected to be available |
| Scalability             | Up to 100 non-relay nodes                               |
| Message Sending Latency | 1-second latency for dequeuing                          |
| Decentralization        | Fully decentralized, but some relay nodes are needed    |
| Discoverability (Nodes) | Achieved after connecting to the relay                  |
| NAT Traversal           | Supports both public and private nodes                  |
| Monitoring & Analytics  | Tracks connected nodes, relays, messaging rates, etc.   |
| Underlying Protocol     | [To be determined] (Planned: TCP with QUIC)             |
| Node Availability       | [To be determined]                                      |
| Message Routing         | [To be determined]                                      |
| Upgradability           | [To be determined]                                      |
| Burst Messaging         | [To be determined]                                      |
| Idle Network State      | [To be determined]                                      |

### Unsupported Features:

| Feature                          | Current state                                                                       |
| -------------------------------- | ----------------------------------------------------------------------------------- |
| High throughput                  | Only sending messages over different channels in parallel are meant to be supported |
| Consistent messaging order       | Not guaranteed and not planned                                                      |
| Relays count constraints support | Not planned, new relays must be added on demand                                     |
| Persistence                      | Not planned                                                                         |
| Discoverability (relays)         | Relays are not meant to be well-known ip addresses and don't need to be discovered  |

## TODO

_Describe the features in detail_
