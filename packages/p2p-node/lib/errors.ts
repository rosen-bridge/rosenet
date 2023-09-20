export class NotStartedP2PNodeError extends Error {
  constructor() {
    super("P2P node isn't ready, please try later");
  }
}
