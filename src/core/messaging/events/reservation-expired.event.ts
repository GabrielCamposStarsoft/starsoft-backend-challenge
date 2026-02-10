// This interface represents the event emitted when a reservation expires.
// It contains identifiers for the reservation, seat, and session associated with the expired reservation.
export interface ReservationExpiredEvent {
  reservationId: string;
  seatId: string;
  sessionId: string;
}
