/**
 * Enum representing the possible statuses for a reservation.
 *
 * @enum {string}
 * @property {string} PENDING   - The reservation has been made but not yet confirmed.
 * @property {string} CONFIRMED - The reservation has been confirmed.
 * @property {string} EXPIRED   - The reservation has expired and is no longer valid.
 * @property {string} CANCELLED - The reservation has been cancelled by the user or the system.
 */
export enum ReservationStatus {
  /**
   * The reservation has been made but not yet confirmed.
   * Typically represents reservations that are awaiting user or system confirmation.
   */
  PENDING = 'pending',

  /**
   * The reservation has been confirmed.
   * Payment or required steps have been completed.
   */
  CONFIRMED = 'confirmed',

  /**
   * The reservation has expired and is no longer valid.
   * This status occurs when confirmation did not happen before expiry.
   */
  EXPIRED = 'expired',

  /**
   * The reservation has been cancelled by the user or the system.
   * Cancellations may be voluntary or due to policy.
   */
  CANCELLED = 'cancelled',
}
