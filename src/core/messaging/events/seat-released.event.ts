/**
 * @fileoverview Payload for seat.released event.
 *
 * Emitted when a reserved seat is released (expiration or cancellation).
 *
 * @event seat-released
 */

import type { Either } from 'src/common';

/**
 * Event payload when a seat is released.
 */
export interface SeatReleasedEvent {
  /** Reservation UUID that triggered the release (used for deduplication). */
  reservationId: string;

  /** Seat UUID. */
  seatId: string;

  /** Session UUID. */
  sessionId: string;

  /** Reason for release. */
  reason: Either<'expired', 'cancelled'>;
}
