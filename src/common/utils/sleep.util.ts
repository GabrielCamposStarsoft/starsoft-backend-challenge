import type { Either } from '../types';

/**
 * Pauses execution asynchronously for the specified number of milliseconds.
 *
 * Useful in async/await workflows to introduce a delay without blocking the event loop.
 *
 * @util sleep
 * @param {number} ms - Number of milliseconds to pause execution.
 * @returns {Promise<void>} A Promise that resolves after the given delay.
 *
 * @example
 * await sleep(1000); // sleep for 1 second
 */
export const sleep: (ms: number) => Promise<void> = (
  ms: number,
): Promise<void> => {
  return new Promise<void>(
    (resolve: (value: Either<void, PromiseLike<void>>) => void) =>
      setTimeout(resolve, ms),
  );
};
