/**
 * @fileoverview Union type alias for Either pattern.
 *
 * @module either
 */

/**
 * Union of two types (left or right).
 *
 * @template L - Left/alternative type
 * @template R - Right/primary type
 */
export type Either<L, R> = L | R;
