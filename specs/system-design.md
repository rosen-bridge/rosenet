# RoseNet System Design Spec

## Introduction

RoseNet, a decentralized p2p protocol empowering Rosen Bridge guards, aims to
provide a secure and reliable communication network. This document outlines the
design principles, assumptions, and features of RoseNet.

| Status | creation date | last update date | version |
| ------ | ------------- | ---------------- | ------- |
| Draft  | 25 Dec 2023   | 17 Feb 2024      | Draft-2 |

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

Implementation status:  
🏁 Not started  
🚧 Under development  
✅ Finished

| Status | Feature                 | Current State                                                      |
| ------ | ----------------------- | ------------------------------------------------------------------ |
| 🚧     | Topology (ZeroLayer)    | Starts as a star, upgrades to partially-connected mesh             |
| 🚧     | Topology (RoseLayer)    | Gossip-based partially-connected mesh                              |
| 🏁     | Message Delivery        | Guaranteed within a 5-minute latency window                        |
| ✅     | Whitelisting            | Configurable for both relays and nodes, being mandatory for relays |
| ✅     | Communication Security  | All messages are end-to-end encrypted                              |
| ✅     | Sybil Attack Mitigation | Relays only accept connections from whitelisted nodes              |
| 🏁     | Network Availability    | At least 60% of the network is expected to be available            |
| 🏁     | Scalability             | Up to 100 non-relay nodes                                          |
| 🏁     | Message Sending Latency | 1-second latency for dequeuing                                     |
| N/A    | Decentralization        | Mostly decentralized, but some relay nodes are required            |
| 🚧     | Discoverability (Nodes) | Achieved after connecting to the relay                             |
| 🚧     | NAT Traversal           | Supports both public and private nodes                             |
| 🏁     | Monitoring & Analytics  | Tracks connected nodes, relays, messaging rates, etc.              |
| 🏁     | Node Availability       | [To be determined]                                                 |
| 🏁     | Message Routing         | [To be determined]                                                 |
| 🏁     | Upgradability           | [To be determined]                                                 |
| 🏁     | Burst Messaging         | [To be determined]                                                 |
| 🏁     | Idle Network State      | [To be determined]                                                 |

### Unsupported Features:

| Feature                          | Current state                                                                       |
| -------------------------------- | ----------------------------------------------------------------------------------- |
| Openness                         | New nodes cannot join RoseNet until whitelisted in at least one relay               |
| High throughput                  | Only sending messages over different channels in parallel are meant to be supported |
| Consistent messaging order       | Not guaranteed and not planned                                                      |
| Relays count constraints support | Not planned, new relays must be added on demand                                     |
| Persistence                      | Not planned                                                                         |
| Discoverability (relays)         | Relays are not meant to be well-known ip addresses and don't need to be discovered  |

## RoseNet design principles

### Plug and Play

RoseNet is designed for easy use with minimal configuration. In the RoseNet APIs, many libp2p configurations are intentionally inaccessible, forming a fundamental aspect of its design philosophy. The intention is for RoseNet to be employed without extensive customization, relying on configurations only when necessary for optimal node performance. If your customization requirements surpass the scope of RoseNet APIs, consider transitioning to direct utilization of libp2p for more granular control over network behavior.

### Limited Access Network

Rosen Bridge guards, comprising a select group of trusted entities, form the backbone of RoseNet. Designed primarily for Rosen Bridge guards, RoseNet operates as an exclusive, invite-only network. To connect to RoseNet, a node must be whitelisted in at least one relay. This intentional limitation comes with its own set of advantages and disadvantages, outlined below.

#### Pros

- **Enhanced Security:** The "invitation-only" requirement acts as a robust barrier against potential malicious nodes, significantly bolstering the network's security.
- **Trust Simplicity:** The high-security nature of RoseNet obviates the need for complex reputation systems, streamlining trust dynamics within the network.
- **Limited Scale, Limited Issues:** The closed nature of RoseNet results in a smaller node count, mitigating scaling challenges commonly faced by open peer-to-peer networks. This ensures a more manageable and efficient network infrastructure tailored to the intended scale of RoseNet.

#### Cons

- **Limited Applicability:** While RoseNet excels in security and selectivity, its closed design may limit its suitability for applications that thrive on openness. Many decentralized applications, by nature, aim to cater to a broad user base, making RoseNet less ideal for such use cases.
- **Distributing New Whitelisted Nodes:** The current implementation relies on a manual mechanism for distributing new whitelisted nodes. This means that relays must perform consensus manually outside of the network, posing challenges in terms of scalability and automation.
- **Whitelist Conflicts:** There may be instances of whitelist conflicts, potentially causing issues within the network. Careful coordination and resolution mechanisms are essential to address these conflicts effectively.
- **Centralized Trust Establishment:** The reliance on whitelisting through relays introduces a centralized trust establishment point, which could be a potential vulnerability if not managed carefully.
- **User Onboarding Complexity:** The invite-only model might introduce complexities in onboarding new users and nodes, potentially hindering network growth.

This nuanced perspective aims to provide a comprehensive understanding of RoseNet's intentional limitations, facilitating informed decision-making based on its unique strengths and drawbacks.

## Features

### Whitelisting

In RoseNet, the strategic implementation of whitelisting plays a pivotal role, with its application spanning both nodes and relays. This necessity stems from the fundamental design principles governing RoseNet. To gain a deeper understanding of the advantages and disadvantages associated with whitelisting, one must delve into the limited access network design principle.

When engaging in the whitelisting process, careful consideration of the following factors is crucial:

- **Essential Role in Relays:** Whitelists are indispensable for the proper functioning of relays, serving as the cornerstone of the network's design.

- **Decentralization via Relays:** The number of relays directly impacts the decentralization of the network. To maintain a decentralized characteristic, it is advisable to authorize a substantial number of relays, each sanctioned by different entities.

- **Distribution Mechanism Complexity:** Establishing a reliable whitelisting distribution mechanism is imperative. Questions such as when RelayB should replicate the whitelisting of NodeX after RelayA has done so, and how to ensure trustworthiness against malicious nodes, require thoughtful consideration.

- **Guarding Against Malicious Relays:** As RoseNet expands, the potential for the emergence of malicious relays increases. Nodes incorporate whitelisting mechanisms as a defensive measure. In the event of malicious relays, nodes must configure their whitelists to exclusively accept connections from trusted parties.

- **Resilience to Whitelist Conflicts:** The network's resilience hinges on its ability to navigate whitelist conflicts gracefully. In a network where all nodes and relays can whitelist each other, conflicts regarding trusted entities can easily arise, necessitating a robust conflict resolution mechanism.

This enhanced approach to whitelisting not only ensures the smooth operation of RoseNet but also fortifies its resilience against potential challenges, thereby contributing to a more secure and reliable decentralized network.

## TODO

_Describe the features in detail_
