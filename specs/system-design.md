# RoseNet System Design Specification

This document outlines the core principles, assumptions, and features underlying the development of RoseNet.

| Status | Creation Date | Last Update Date | Version |
| ------ | ------------- | ---------------- | ------- |
| Draft  | 25 Dec 2023   | 19 Oct 2024      | Draft-4 |

Author: @mkermani144  
Contributors: N/A

## Introduction to RoseNet

RoseNet is a decentralized peer-to-peer (p2p) protocol designed to empower Rosen Bridge guards by providing a secure and reliable communication network.

## RoseNet in Action

RoseNet's current implementation utilizes libp2p internally. Before delving into specific system design details, let's establish a comprehensive understanding of RoseNet's functionality.

### Node Types

RoseNet consists of two distinct node types:

1. Normal nodes (referred to as "nodes" in this document)
2. Relays

This conceptual framework mirrors that of libp2p, where communication between two private nodes requires a well-known, public intermediary called a relay to efficiently route traffic.

### Connection Process

Consider the following example of NodeA connecting to RoseNet through RelayR:

1. NodeA attempts to establish a connection with RelayR using minimal configurations, primarily the RelayR multiaddress.
2. If NodeA is not whitelisted in RelayR, the connection fails, and NodeA cannot join RoseNet.
3. Upon successful whitelisting and connection to RelayR, NodeA initiates the dissemination of its multiaddress across RoseNet using a gossip-based protocol within libp2p.
4. Over time, every node becomes aware of NodeA's presence in RoseNet, enabling seamless message exchange.
5. If NodeA can identify its own public IP, even behind a NAT, it may perform NAT traversal and connect directly to other nodes via hole punching.
6. NodeA can then send or receive direct or pubsub messages, based on application layer usage.

## RoseNet Design Principles

### Plug and Play

RoseNet is designed for easy use with minimal configuration. Many libp2p configurations in the RoseNet APIs are preset with reasonable defaults, allowing for immediate use without extensive customization.

### Limited Access Network

RoseNet operates as an exclusive, invite-only network primarily designed for Rosen Bridge guards. To connect to RoseNet, a node must be whitelisted in at least one relay.

### Throughput Limitation

By default, RoseNet nodes have limited throughput for both pubsub and direct messages. This preventive measure aims to avoid potential resource (CPU/memory) outages, which could lead to non-deterministic states for nodes and, over time, the entire network. These throughput limits are configurable based on specific use cases.

## Features Summary

| Feature                       | Description                                                               |
| ----------------------------- | ------------------------------------------------------------------------- |
| Fast Message Delivery         | Low overhead for sending messages with successful hole punching           |
| Message Delivery Verification | Implemented through an acknowledgment mechanism                           |
| Whitelisting                  | Configurable for both relays and nodes; mandatory for relays              |
| Communication Security        | End-to-end encryption for all messages                                    |
| Sybil Attack Mitigation       | Relays only accept connections from whitelisted nodes                     |
| Scalability                   | Guaranteed scale of up to 40 running non-relay nodes                      |
| Decentralization              | Mostly decentralized, with some relay nodes required                      |
| Discoverability (Nodes)       | Achieved after connecting to the relay                                    |
| NAT Traversal                 | Implemented through the DCUtR protocol                                    |
| Burst Messaging               | Supports concurrent sending of numerous messages within throughput limits |

### Unsupported Features

| Feature                    | Current State                                                   |
| -------------------------- | --------------------------------------------------------------- |
| Openness                   | New nodes require whitelisting in at least one relay to join    |
| Consistent Messaging Order | Not guaranteed and not planned                                  |
| Backward-compatibility     | All nodes and relays must use the same RoseNet protocol version |
| Message Routing            | Not planned                                                     |
