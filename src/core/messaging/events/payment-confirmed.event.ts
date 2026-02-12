/**
 * @fileoverview Payload for payment.confirmed event.
 *
 * Emitted when a sale is finalized. Consumers invalidate cache and audit log.
 *
 * @event payment-confirmed
 */

/**
 * Event payload when payment is confirmed and sale created.
 */
export interface PaymentConfirmedEvent {
  /** Sale UUID. */
  saleId: string;

  /** Reservation UUID that was converted to sale. */
  reservationId: string;

  /** Session UUID. */
  sessionId: string;

  /** Seat UUID. */
  seatId: string;

  /** User UUID (buyer). */
  userId: string;

  /** Payment amount. */
  amount: number;
}
