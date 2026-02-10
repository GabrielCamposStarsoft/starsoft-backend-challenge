/**
 * Enum representing different event names used throughout the application.
 *
 * @enum {string}
 * @property {string} RESERVATION_CREATED - Emitted when a reservation is created.
 * @property {string} RESERVATION_EXPIRED - Emitted when a reservation expires without payment.
 * @property {string} PAYMENT_CONFIRMED  - Emitted when a payment for a reservation is confirmed.
 * @property {string} SEAT_RELEASED      - Emitted when a reserved seat is released.
 */
export enum Events {
  RESERVATION_CREATED = 'reservation.created',
  RESERVATION_EXPIRED = 'reservation.expired',
  PAYMENT_CONFIRMED = 'payment.confirmed',
  SEAT_RELEASED = 'seat.released',
}
