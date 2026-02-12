/**
 * @fileoverview Nullable type utility.
 *
 * @module nullable
 */

/**
 * Type that allows null in addition to T.
 *
 * @template T - Base type
 */
export type Nullable<T> = T | null;
