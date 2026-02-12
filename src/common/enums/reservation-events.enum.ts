/**
 * @fileoverview Domain event names for messaging.
 *
 * Used as event types when publishing/consuming RabbitMQ messages.
 * Aligns producers and consumers on payload structure per event.
 *
 * @enum events
 */

/**
 * Domain event identifiers for the cinema system.
 *
 * @enum {string}
 */
export enum ReservationEvents {
  /** Emitted when a reservation is created; payload includes reservation ID and details. */
  RESERVATION_CREATED = 'reservation.created',

  /** Emitted when a reservation expires without payment; seats are released. */
  RESERVATION_EXPIRED = 'reservation.expired',

  /** Emitted when payment is confirmed; triggers sale creation and seat finalization. */
  PAYMENT_CONFIRMED = 'payment.confirmed',

  /** Emitted when a reserved seat is released (expiration or cancellation). */
  SEAT_RELEASED = 'seat.released',
}
