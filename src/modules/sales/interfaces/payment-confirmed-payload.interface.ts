/**
 * @fileoverview Interface for the payload representing the confirmation of a payment.
 *
 * @interface payment-confirmed-payload-interface
 */

/**
 * Payload representing the confirmation of a payment.
 *
 * @interface IPaymentConfirmedPayload
 * @property {string} reservationId - The unique identifier of the associated reservation.
 * @property {number} amount - The monetary amount that was confirmed as paid.
 */
export interface IPaymentConfirmedPayload {
  reservationId: string;
  amount: number;
}
