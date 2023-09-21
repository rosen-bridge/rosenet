import fs from 'fs';
import * as lp from 'it-length-prefixed';
import map from 'it-map';
import { pipe } from 'it-pipe';
import { pushable, Pushable } from 'it-pushable';
import { createLibp2p, Libp2p } from 'libp2p';
import {
  fromString as uint8ArrayFromString,
  toString as uint8ArrayToString,
} from 'uint8arrays';

import { groupBy, negate } from 'lodash-es';

import { gossipsub } from '@chainsafe/libp2p-gossipsub';
import { noise } from '@chainsafe/libp2p-noise';

import { bootstrap } from '@libp2p/bootstrap';
import { Connection, Stream } from '@libp2p/interface-connection';
import { OPEN } from '@libp2p/interface-connection/status';
import { PeerId } from '@libp2p/interface-peer-id';
import { mplex } from '@libp2p/mplex';
import { createEd25519PeerId, createFromJSON } from '@libp2p/peer-id-factory';
import { pubsubPeerDiscovery } from '@libp2p/pubsub-peer-discovery';
import { webSockets } from '@libp2p/websockets';

import * as multiaddr from '@multiformats/multiaddr';

import JsonBigInt from '@rosen-bridge/json-bigint';
import { AbstractLogger, DummyLogger } from '@rosen-bridge/logger-interface';

import { NotStartedP2PNodeError } from './errors';

import {
  ConnectionStream,
  P2PNodeConfig,
  ReceiveDataCommunication,
  SendDataCommunication,
  SubscribeChannel,
  SubscribeChannels,
  SubscribeChannelWithURL,
} from './types';

class P2PNode {
  private static instance: P2PNode;
  private static config: P2PNodeConfig;
  private static logger: AbstractLogger;

  private _messageQueue = pushable();
  private _node: Libp2p | undefined;
  private _subscribedChannels: SubscribeChannels = {};

  private constructor() {
    P2PNode.logger.info('P2PNode constructor called.');
  }

  public static initialize = async (
    config: P2PNodeConfig,
    logger: AbstractLogger = new DummyLogger()
  ) => {
    if (!P2PNode.instance) {
      P2PNode.logger = logger;
      P2PNode.logger.debug('P2PNode logger set');

      P2PNode.instance = new P2PNode();
      P2PNode.logger.debug('P2PNode instance created');

      P2PNode.config = config;
      P2PNode.logger.debug('P2PNode config set');

      await P2PNode.instance.startP2PNode();
      P2PNode.logger.debug('P2PNode instance started');

      P2PNode.instance.processMessageQueue();
      P2PNode.logger.debug('P2PNode message queue processing started');
    } else {
      P2PNode.logger.debug(
        'P2PNode is already initialized, avoiding re-initialization'
      );
    }
  };

  /**
   * @return a P2PNode instance (create if it doesn't exist)
   */
  public static getInstance = async () => {
    return P2PNode.instance;
  };

  /**
   * return PeerID or create PeerID if it doesn't exist
   * @return PeerID
   */
  static getOrCreatePeerID = async (): Promise<{
    peerId: PeerId;
    exist: boolean;
  }> => {
    try {
      const peerIdFilePath = P2PNode.config.peerIdFilePath;
      if (!fs.existsSync(peerIdFilePath)) {
        P2PNode.logger.debug(
          "peerId file didn't exist, generating a new peerId.",
          {
            peerIdFilePath,
          }
        );
        return {
          peerId: await createEd25519PeerId(),
          exist: false,
        } as const;
      } else {
        P2PNode.logger.debug(
          'peerId file exists, reading and returning the contents of the file as peerId.',
          {
            peerIdFilePath,
          }
        );
        const jsonData = fs.readFileSync(peerIdFilePath, 'utf8');
        const p2pNodePeerIdJson: Parameters<typeof createFromJSON>['0'] =
          JSON.parse(jsonData);
        P2PNode.logger.debug('PeerId file read and parsed successfully.');
        return {
          peerId: await createFromJSON(p2pNodePeerIdJson),
          exist: true,
        };
      }
    } catch (error) {
      throw new Error(`Couldn't get or create a PeerID: ${error}`);
    }
  };

  /**
   * If it didn't exist PeerID file, this function try to create a file and save peerId into that
   * @param peerObj { peerId: PeerId; exist: boolean }
   */
  static savePeerIdIfNeeded = async (peerObj: {
    peerId: PeerId;
    exist: boolean;
  }) => {
    if (!peerObj.exist) {
      const peerId = peerObj.peerId;
      let privateKey: Uint8Array;
      let publicKey: Uint8Array;
      if (peerId.privateKey && peerId.publicKey) {
        privateKey = peerId.privateKey;
        publicKey = peerId.publicKey;
      } else throw new Error('PrivateKey for p2p is required');

      const p2pNodePeerIdJson = {
        id: peerId.toString(),
        privKey: uint8ArrayToString(privateKey, 'base64pad'),
        pubKey: uint8ArrayToString(publicKey, 'base64pad'),
      };
      const jsonData = JSON.stringify(p2pNodePeerIdJson);
      fs.writeFile(
        P2PNode.config.peerIdFilePath,
        jsonData,
        'utf8',
        function (error) {
          if (error) {
            P2PNode.logger.warn(
              `An error occurred while writing created PeerId to the file.`
            );
            error.stack && P2PNode.logger.warn(error.stack);
            throw error;
          }
          P2PNode.logger.info('PeerId file created.');
        }
      );
    } else {
      P2PNode.logger.debug('PeerId exists, ignored saving to file.', {
        peerObj,
      });
    }
  };

  /**
   * Only used for Typescript narrowing.
   * @returns if channel has URL
   */
  private hasUrl = (
    channel: SubscribeChannel
  ): channel is SubscribeChannelWithURL =>
    !!(channel as SubscribeChannelWithURL).url;

  /**
   * @return list of subscribed channels' name
   */
  getSubscribedChannels = () => {
    return Object.keys(this._subscribedChannels);
  };

  /**
   * @return P2PNode's Id
   */
  getP2PNodeId = () => {
    if (!this._node) {
      throw new NotStartedP2PNodeError();
    }
    return this._node.peerId.toString();
  };

  /**
   * @return string of PeerID
   */
  getPeerIds = () => {
    if (!this._node) {
      throw new NotStartedP2PNodeError();
    }
    return this._node.getPeers().map((peer) => peer.toString());
  };

  /**
   * @return discovered peers count in the address book
   */
  getDiscoveredPeersCount = async () => {
    if (!this._node) {
      throw new NotStartedP2PNodeError();
    }
    return (await this._node.peerStore.all()).length;
  };

  /**
   * @returns connected peers count
   */
  getConnectedPeersCount = () => {
    return this.getPeerIds().length;
  };

  /**
   * @returns relay states grouped by the connection status
   */
  getRelayStates = () => {
    const connectedPeers = this.getPeerIds();
    const relayStates = groupBy(P2PNode.config.relays.peerIDs, (peer) =>
      connectedPeers.includes(peer) ? 'connected' : 'notConnected'
    );
    return relayStates;
  };

  /**
   * Checks if a peer belongs to a relay
   *
   * @param peer
   */
  isRelay = (peer: string) => P2PNode.config.relays.peerIDs.includes(peer);

  /**
   * Checks if a peer belongs to a listener (and not a relay)
   *
   * @param peer
   */
  isListener = negate(this.isRelay);

  /**
   * establish connection to relay
   * @param channel: string desire channel for subscription
   * @param callback: a callback function for subscribed channel
   * @param url: string for apiCallbackFunction
   */
  subscribeChannel = (
    channel: string,
    callback: SubscribeChannel['func'],
    url?: string
  ) => {
    const callbackObj = {
      func: callback,
      ...(url && { url }),
    } as SubscribeChannel;

    if (this._subscribedChannels[channel]) {
      if (
        this._subscribedChannels[channel].find(
          (sub) =>
            sub.func.name === callback.name &&
            ((this.hasUrl(sub) && sub.url === url) || !url)
        )
      ) {
        P2PNode.logger.info('A redundant subscribed channel detected.', {
          channel,
          url,
        });
        return;
      }
      this._subscribedChannels[channel].push(callbackObj);
      P2PNode.logger.info(`Channel [${channel}] subscribed.`, {
        url,
      });
    } else {
      this._subscribedChannels[channel] = [];
      this._subscribedChannels[channel].push(callbackObj);
      P2PNode.logger.info(`Channel [${channel}] subscribed.`, {
        url,
      });
    }
  };

  /**
   * TODO: This method is not written in arrow form because ts-mockito has some
   * issues with mocking class fields which are of type arrow function. If you
   * are going to convert it to an arrow method, make sure all tests pass without
   * issue.
   */
  /**
   * send message to specific peer or broadcast it
   * @param channel: String
   * @param msg: string
   * @param receiver optional
   */
  async sendMessage(channel: string, msg: string, receiver?: string) {
    const data: SendDataCommunication = {
      msg: msg,
      channel: channel,
      ...(receiver && { receiver }),
    };
    if (receiver) {
      const receiverPeerId = await createFromJSON({ id: `${receiver}` });
      this.pushMessageToMessageQueue(receiverPeerId, data);
      P2PNode.logger.debug('Message pushed to the message queue.', { data });
    } else {
      // send message for listener peers (not relays)
      const peers = this._node!.getPeers().filter((peer) =>
        this.isListener(peer.toString())
      );
      for (const peer of peers) {
        this.pushMessageToMessageQueue(peer, data);
        P2PNode.logger.debug('Message pushed to the message queue.', {
          data,
          peer,
        });
      }
    }
  }

  /**
   * Creates a `PeerId` object from a string
   * @param id peer id string
   */
  private createFromString = (id: string) => createFromJSON({ id });

  /**
   * Adds an array of peers to address book. Because `autoDial` is enabled, it
   * causes those peers to be dialed, too.
   * @param peers id of peers
   */
  addPeersToAddressBook = async (peers: string[]) => {
    if (this._node) {
      for (const peer of peers) {
        for (const addr of P2PNode.config.relays.multiaddrs) {
          try {
            const multi = multiaddr.multiaddr(
              addr.concat(`/p2p-circuit/p2p/${peer}`)
            );
            if (!this.getPeerIds().includes(peer)) {
              await this._node.peerStore.addressBook.add(
                await this.createFromString(peer),
                [multi]
              );
              P2PNode.logger.debug(`Peer [${peer}] added to the address book.`);
            }
          } catch (error) {
            P2PNode.logger.error(
              `An error occurred while trying to add peer to address book: ${error}`,
              { peer }
            );
            if (error instanceof Error && error.stack) {
              P2PNode.logger.error(error.stack);
            }
          }
        }
      }
    }
  };

  /**
   * Removes a peer from the address book.
   * @param peer id of peer
   */
  removePeerFromAddressBook = async (peer: string) => {
    if (this._node) {
      try {
        await this._node.peerStore.addressBook.delete(
          await this.createFromString(peer)
        );
        P2PNode.logger.debug(`Peer [${peer}] removed from the address book.`);
      } catch (error) {
        P2PNode.logger.warn(
          `An error occurred while removing peer from address book: ${error}`,
          { peer }
        );
        if (error instanceof Error && error.stack) {
          P2PNode.logger.warn(error.stack);
        }
      }
    }
  };

  /**
   * create or find an open stream for specific peer and protocol
   * @param node
   * @param peer create or find stream for peer
   * @param protocol try to create a stream with this protocol
   */
  private getOpenStreamAndConnection = async (
    node: Libp2p,
    peer: PeerId,
    protocol: string
  ): Promise<ConnectionStream> => {
    let connection: Connection | undefined = undefined;
    let stream: Stream | undefined = undefined;

    const peerString = peer.toString();

    for (const conn of node.getConnections(peer)) {
      if (conn.stat.status === OPEN) {
        for (const obj of conn.streams) {
          if (
            obj.stat.protocol === protocol &&
            obj.stat.direction === 'outbound'
          ) {
            stream = obj;
            break;
          }
        }
        if (stream) {
          connection = conn;
          P2PNode.logger.debug(
            `Found an existing connection and a stream with protocol [${protocol}] to peer [${peerString}].`,
            { conn, stream }
          );
          break;
        }
      }
    }

    if (!connection) {
      P2PNode.logger.debug(
        `Found no connection to peer [${peerString}], trying to dial...`
      );
      connection = await node.dial(peer);
      P2PNode.logger.debug(`Peer [${peerString}] dialed successfully.`, {
        connection,
      });
    }
    if (!stream) {
      P2PNode.logger.debug(
        `Found no stream with protocol [${protocol}] to peer [${peerString}], trying to create a new one...`
      );
      stream = await connection.newStream([protocol]);
      P2PNode.logger.debug(
        `A new stream with protocol [${protocol}] to peer [${peerString}] created successfully.`,
        { stream }
      );
    }
    return {
      stream: stream,
      connection: connection,
    };
  };

  /**
   * Pushes a message to the message queue
   * @param peer
   * @param messageToSend
   */
  private pushMessageToMessageQueue = (
    peer: PeerId,
    messageToSend: SendDataCommunication
  ) => {
    this._messageQueue.push(
      this.objectToUint8Array({ peer, messageToSend, retriesCount: 0 })
    );
  };

  /**
   * handle incoming messages with `config.protocolName` protocol
   * @param stream
   * @param connection
   */
  private handleIncomingMessage = async (
    stream: Stream,
    connection: Connection
  ) => {
    pipe(
      // Read from the stream (the source)
      stream.source,
      // Decode length-prefixed data
      lp.decode(),
      // Turn buffers into strings
      (source) => map(source, (buf) => uint8ArrayToString(buf.subarray())),
      // Sink function
      async (source) => {
        try {
          P2PNode.logger.debug(
            `A new message with [${
              P2PNode.config.protocolName
            }] protocol received from peer [${connection.remotePeer.toString()}], trying to parse...`
          );
          // For each chunk of data
          for await (const msg of source) {
            const receivedData: ReceiveDataCommunication = JsonBigInt.parse(
              msg.toString()
            );

            P2PNode.logger.debug(
              `The new message with [${P2PNode.config.protocolName}] parsed successfully.`,
              {
                message: receivedData,
                subscribedChannels: this._subscribedChannels,
                fromPeer: connection.remotePeer.toString(),
              }
            );

            const runSubscribeCallback = async (channel: SubscribeChannel) => {
              this.hasUrl(channel)
                ? channel.func(
                    receivedData.msg,
                    receivedData.channel,
                    connection.remotePeer.toString(),
                    channel.url
                  )
                : channel.func(
                    receivedData.msg,
                    receivedData.channel,
                    connection.remotePeer.toString()
                  );
            };
            if (this._subscribedChannels[receivedData.channel]) {
              P2PNode.logger.debug(
                `Received a message from [${connection.remotePeer.toString()}] in subscribed channel [${
                  receivedData.channel
                }].`
              );
              this._subscribedChannels[receivedData.channel].forEach(
                runSubscribeCallback
              );
            } else {
              P2PNode.logger.debug(
                `Received a message from [${connection.remotePeer.toString()}] in unsubscribed channel [${
                  receivedData.channel
                }].`
              );
            }
          }
        } catch (error) {
          P2PNode.logger.error(
            `An error occurred while handling stream callback: ${error}`
          );
          if (error instanceof Error && error.stack) {
            P2PNode.logger.error(error.stack);
          }
        }
      }
    ).catch((error) => {
      P2PNode.logger.error(
        `An error occurred while handling broadcast protocol stream: ${error}`
      );
      P2PNode.logger.error(error.stack);
    });
  };

  /**
   * Runs a callback in an interval to log some info
   * @param callback
   */
  private startLoggingInterval = (callback: () => void) => {
    setInterval(callback, P2PNode.config.loggingInterval * 1000);
  };

  /**
   * Tries to re-connect to a disconnected relay. If the relay is connected, the
   * corresponding interval is cleared and connection manager event listener is
   * removed.
   *
   * @param peer peer of recently disconnected peer
   */
  private tryReconnectingRelay = (peer: string) => {
    P2PNode.logger.debug(`Trying to re-connect relay ${peer}...`);

    const interval = setInterval(async () => {
      const multiaddrIndex = P2PNode.config.relays.peerIDs.findIndex(
        (id) => id === peer
      );
      P2PNode.logger.debug(`Trying to add relay to address book...`, { peer });
      try {
        await this._node?.peerStore.addressBook.add(
          await this.createFromString(peer),
          [
            multiaddr.multiaddr(
              P2PNode.config.relays.multiaddrs[multiaddrIndex]
            ),
          ]
        );
        P2PNode.logger.debug(`Relay added to address book successfully.`, {
          peer,
        });
      } catch (error) {
        P2PNode.logger.warn(
          `An error occurred while trying to add relay [${peer}] to address book: ${error}`
        );
        if (error instanceof Error && error.stack) {
          P2PNode.logger.warn(error.stack);
        }
      }
    }, P2PNode.config.relayReconnectionInterval * 1000);

    const controller = new AbortController();

    this._node?.connectionManager.addEventListener(
      'peer:connect',
      async (evt) => {
        const connectedPeer = evt.detail.remotePeer.toString();

        if (connectedPeer === peer) {
          P2PNode.logger.info(`Relay ${peer} re-connected successfully.`);
          clearInterval(interval);
          P2PNode.logger.debug('Relay re-connection interval cleared.', {
            peer,
          });
          controller.abort();
          P2PNode.logger.debug('Relay re-connection event listener removed.', {
            peer,
          });
        }
      },
      { signal: controller.signal }
    );
  };

  /**
   *
   * config a p2p node with peerDiscovery
   * @return a Libp2p object after start node
   */
  private startP2PNode = async () => {
    try {
      const peerId = await P2PNode.getOrCreatePeerID();
      const node = await createLibp2p({
        // get or create new PeerID if it doesn't exist
        peerId: peerId.peerId,
        // Type of communication
        transports: [webSockets()],
        // Enable module encryption message
        connectionEncryption: [noise()],
        streamMuxers: [
          // mplex is a Stream Multiplexer protocol
          mplex(),
        ],
        relay: {
          // Circuit Relay options (this config is part of libp2p core configurations)
          enabled: true, // Allows you to dial and accept relayed connections.
          autoRelay: {
            enabled: true,
          },
        },
        connectionManager: {
          minConnections: P2PNode.config.guardsCount + 10, // We add 10 to handle relays and other possible connections
        },
        pubsub: gossipsub({ allowPublishToZeroPeers: true }),
        peerDiscovery: [
          bootstrap({
            timeout: P2PNode.config.bootstrapTimeout * 1000,
            list: P2PNode.config.relays.multiaddrs,
          }),
          pubsubPeerDiscovery({
            interval: P2PNode.config.pubsubInterval * 1000,
          }),
        ],
      });

      P2PNode.logger.debug('libp2p instance created.');

      // Listen for peers disconnecting
      node.connectionManager.addEventListener(
        'peer:disconnect',
        async (evt) => {
          const peer = evt.detail.remotePeer.toString();

          this.removePeerFromAddressBook(peer);

          if (this.isRelay(peer)) {
            P2PNode.logger.warn(`Relay [${peer}] disconnected.`);
            this.tryReconnectingRelay(peer);
          } else {
            P2PNode.logger.info(`Peer [${peer}] disconnected.`);
          }
        }
      );

      // Listen for new peers
      node.addEventListener('peer:discovery', async (evt) => {
        if (this.isListener(evt.detail.id.toString())) {
          P2PNode.logger.debug(`Found peer [${evt.detail.id.toString()}].`);
          this.addPeersToAddressBook([evt.detail.id.toString()]).catch(
            (error) => {
              P2PNode.logger.error(
                `An error occurred while dialing peer [${evt.detail.id}].`
              );
              P2PNode.logger.error(error.stack);
            }
          );
        }
      });

      // Define protocol for node
      await node.handle(
        P2PNode.config.protocolName,
        async ({ stream, connection }) => {
          // Read the stream
          this.handleIncomingMessage(stream, connection);
        },
        {
          maxInboundStreams:
            P2PNode.config.guardsCount * P2PNode.config.allowedStreamsPerGuard,
          maxOutboundStreams:
            P2PNode.config.guardsCount * P2PNode.config.allowedStreamsPerGuard,
        }
      );

      await node.start();
      P2PNode.logger.info(
        `P2PNode node started with peerId: ${node.peerId.toString()}.`
      );

      this._node = node;

      // this should call after createRelayConnection duo to peerId should save after create relay connection
      await P2PNode.savePeerIdIfNeeded(peerId);

      /**
       * TODO: This is not the ideal way to increase the streams limits, but there
       * seems to be no other way to do it with current libp2p apis. It needs to
       * be changed if such an api is added in the future.
       *
       * Related issues:
       * - https://github.com/libp2p/js-libp2p/issues/1518
       * - local:ergo/rosen-bridge/p2p#6
       */
      const handler = node.registrar.getHandler('/libp2p/circuit/relay/0.1.0');
      node.registrar.unhandle('/libp2p/circuit/relay/0.1.0');
      await node.registrar.handle(
        '/libp2p/circuit/relay/0.1.0',
        handler.handler,
        {
          ...handler.options,
          maxInboundStreams:
            P2PNode.config.guardsCount * P2PNode.config.allowedStreamsPerGuard,
          maxOutboundStreams:
            P2PNode.config.guardsCount * P2PNode.config.allowedStreamsPerGuard,
        }
      );

      // Log peers discovery and connection state
      this.startLoggingInterval(async () => {
        const requiredPeersCount =
          P2PNode.config.guardsCount - 1 + P2PNode.config.relays.peerIDs.length;
        const discoveredPeersCount = await this.getDiscoveredPeersCount();
        const connectedPeersCount = this.getConnectedPeersCount();
        const remainingRequiredDiscoveries =
          requiredPeersCount - discoveredPeersCount;
        const remainingRequiredConnections =
          requiredPeersCount - connectedPeersCount;
        P2PNode.logger.info(
          `[${discoveredPeersCount}] peers are discovered. Required discoveries remaining: ${remainingRequiredDiscoveries}`
        );
        P2PNode.logger.info(
          `[${connectedPeersCount}] out of [${discoveredPeersCount}] discovered peers are connected. Required connections remaining: ${remainingRequiredConnections}`
        );
        P2PNode.logger.debug(`Connected peers are: [${this.getPeerIds()}].`);
      });

      // Log relays connection state
      this.startLoggingInterval(() => {
        const relayStates = this.getRelayStates();
        P2PNode.logger.debug('Relays connection states: ', { relayStates });

        if (relayStates.notConnected?.length) {
          if (relayStates.connected?.length) {
            P2PNode.logger.warn(
              `[${relayStates.notConnected.length}] out of [${P2PNode.config.relays.peerIDs.length}] relays are not connected.`
            );
          } else {
            P2PNode.logger.error(
              `None of [${P2PNode.config.relays.peerIDs.length}] relays are connected. The service won't work properly until at least one relay is connected.`
            );
          }
        }
      });
    } catch (error) {
      P2PNode.logger.error(`An error occurred while starting p2p node.`);
      if (error instanceof Error && error.stack) {
        P2PNode.logger.error(error.stack);
      }
    }
  };

  /**
   * Converts a Unit8Array to an object
   * @param uint8Array
   */
  private uint8ArrayToObject = (uint8Array: Uint8Array) =>
    JsonBigInt.parse(uint8ArrayToString(uint8Array));

  /**
   * Converts an object to Uint8Array
   * @param object
   */
  private objectToUint8Array = (object: unknown) =>
    uint8ArrayFromString(JsonBigInt.stringify(object));

  /**
   * Processes message queue stream and pipes messages to a correct remote pipe
   */
  private processMessageQueue = async () => {
    interface MessageQueueParsedMessage {
      peer: string;
      messageToSend: SendDataCommunication;
      retriesCount: bigint;
    }

    const routesInfo: Record<
      string,
      {
        source: Pushable<Uint8Array>;
        stream: Stream;
      }
    > = {};

    /**
     * Returns the source piped to the provided stream
     * @param stream
     * @param peer
     * @returns The source which is piped to the stream
     */
    const getStreamSource = (stream: Stream, peer: string) => {
      if (routesInfo[peer]?.stream === stream) {
        return routesInfo[peer].source;
      } else {
        routesInfo[peer] = {
          source: pushable(),
          stream: stream,
        };
        const source = routesInfo[peer].source;
        pipe(source, lp.encode(), stream.sink);
        return source;
      }
    };

    /**
     * Retries sending message by pushing it to the queue again
     * @param message
     */
    const retrySendingMessage = (message: Uint8Array) => {
      const { retriesCount, ...rest }: MessageQueueParsedMessage =
        this.uint8ArrayToObject(message);

      const newRetriesCount = retriesCount + 1n;

      if (newRetriesCount <= P2PNode.config.messageSendingRetriesMaxCount) {
        const timeout =
          1000 *
          P2PNode.config.messageSendingRetriesExponentialFactor **
            Number(newRetriesCount);

        setTimeout(() => {
          P2PNode.logger.info(
            `Retry #${retriesCount} for sending a failed message...`
          );
          P2PNode.logger.debug(`Message content is: `, {
            messageToSend: rest.messageToSend,
          });

          this._messageQueue.push(
            this.objectToUint8Array({
              ...rest,
              retriesCount: newRetriesCount,
            })
          );
        }, timeout);
      } else {
        P2PNode.logger.error(
          `Failed to send a message after ${P2PNode.config.messageSendingRetriesMaxCount} retries, message dropped.`
        );
        P2PNode.logger.debug(`Message content was: `, {
          messageToSend: rest.messageToSend,
        });
      }
    };

    for await (const message of this._messageQueue) {
      try {
        const { peer, messageToSend, retriesCount }: MessageQueueParsedMessage =
          this.uint8ArrayToObject(message);

        const connStream = await this.getOpenStreamAndConnection(
          this._node!,
          await this.createFromString(peer),
          P2PNode.config.protocolName
        );

        try {
          const source = getStreamSource(connStream.stream, peer);

          source.push(this.objectToUint8Array(messageToSend));

          if (retriesCount) {
            P2PNode.logger.info(
              `Retry #${retriesCount} was successful for a message.`
            );
            P2PNode.logger.debug(`Message was: `, { messageToSend });
          }
        } catch (error) {
          P2PNode.logger.error(
            `An error occurred while trying to get stream source: ${error}`
          );
        }
      } catch (error) {
        P2PNode.logger.error(
          `An error occurred while trying to process a message in the messages queue`
        );
        if (error instanceof Error && error.stack) {
          P2PNode.logger.error(error.stack);
        }
        retrySendingMessage(message);
      }
    }
  };
}

export default P2PNode;
