/**
 * A scenario is an async generator that yields nothing, never returns, and
 * accepts scenario duration as parameter to generator's `next` method
 */
export type Scenario = AsyncGenerator<undefined, never, number>;
