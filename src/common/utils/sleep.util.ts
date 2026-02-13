import type { Either } from '../types';

/**
 * Async sleep for polling without busy-waiting.
 *
 * @param ms - Milliseconds to sleep
 */
export const sleep: (ms: number) => Promise<void> = (
  ms: number,
): Promise<void> => {
  return new Promise<void>(
    (resolve: (value: Either<void, PromiseLike<void>>) => void) =>
      setTimeout(resolve, ms),
  );
};
