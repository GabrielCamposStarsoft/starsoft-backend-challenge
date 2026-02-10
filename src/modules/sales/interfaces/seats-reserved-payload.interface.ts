export interface ISeatsReservedPayload {
  sessionId: string;
  userId: string;
  seatIds: Array<string>;
}
