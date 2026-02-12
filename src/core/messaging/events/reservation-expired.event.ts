/**
 * @fileoverview Payload for reservation.expired event.
 *
 * Emitted when a reservation expires without payment. Seat is released.
 *
 * @event reservation-expired
 */

/**
 * Event payload when a reservation expires.
 */
export interface ReservationExpiredEvent {
  /** Reservation UUID. */
  reservationId: string;

  /** Seat UUID (released). */
  seatId: string;

  /** Session UUID. */
  sessionId: string;
}
