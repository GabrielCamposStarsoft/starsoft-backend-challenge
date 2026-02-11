// This interface represents the event emitted when a seat is released.
// It contains identifiers for the seat and session, and the reason for the release.
export interface SeatReleasedEvent {
  seatId: string;
  sessionId: string;
  reason: 'expired' | 'cancelled';
}
