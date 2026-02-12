/**
 * @fileoverview Optional type utility.
 *
 * @module optional
 */

/**
 * Type that allows null or undefined in addition to T.
 *
 * @template T - Base type
 */
export type Optional<T> = T | null | undefined;
