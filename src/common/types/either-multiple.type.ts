/**
 * @fileoverview Union of array element types.
 *
 * @module either-multiple
 */

/**
 * Extracts union of element types from tuple/array.
 *
 * @template T - Tuple type (e.g. [boolean, Promise<boolean>, Observable<boolean>])
 */
export type EitherMultiple<T extends unknown[]> = T[number];
