// This interface represents the event emitted when a payment is confirmed.
// It contains identifiers for the sale, reservation, session, seat, and user, as well as the payment amount.
export interface PaymentConfirmedEvent {
  saleId: string;
  reservationId: string;
  sessionId: string;
  seatId: string;
  userId: string;
  amount: number;
}
