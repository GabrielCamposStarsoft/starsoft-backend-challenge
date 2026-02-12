export interface IAvailabilityResponse {
  sessionId: string;
  totalSeats: number;
  availableSeats: number;
  seats: Array<{ id: string; label: string }>;
}
