/**
 * @fileoverview Reservation TTL in milliseconds.
 *
 * Time-to-live for reservations. Configurable via RESERVATION_TTL_MS env, defaults to 30000 ms.
 *
 * @constant reservation-ttl-ms
 */
export const RESERVATION_TTL_MS: number = parseInt(
  process.env.RESERVATION_TTL_MS ?? '30000',
  10,
);
