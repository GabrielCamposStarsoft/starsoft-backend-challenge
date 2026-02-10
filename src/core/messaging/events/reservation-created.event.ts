// This interface represents the event emitted when a reservation is created.
// It contains identifiers for the reservation, session, seat, and user, as well as the expiration date.
export interface ReservationCreatedEvent {
  reservationId: string;
  sessionId: string;
  seatId: string;
  userId: string;
  expiresAt: Date;
}
