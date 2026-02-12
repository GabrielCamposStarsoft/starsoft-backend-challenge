/**
 * @fileoverview Payload for reservation.created event.
 *
 * Emitted when a reservation is created. Consumers invalidate cache and audit.
 *
 * @event reservation-created
 */

/**
 * Event payload when a reservation is created.
 */
export interface ReservationCreatedEvent {
  /** Reservation UUID. */
  reservationId: string;

  /** Session UUID. */
  sessionId: string;

  /** Seat UUID. */
  seatId: string;

  /** User UUID (reserver). */
  userId: string;

  /** Reservation expiration (ISO date). */
  expiresAt: Date;
}
