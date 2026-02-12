/**
 * @fileoverview Seat availability status.
 *
 * @enum seat-status
 */

/**
 * Seat status for a session.
 *
 * @enum {string}
 */
export enum SeatStatus {
  /** Seat can be reserved. */
  AVAILABLE = 'available',

  /** Seat has a pending reservation. */
  RESERVED = 'reserved',

  /** Seat has been sold. */
  SOLD = 'sold',
}
