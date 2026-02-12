/**
 * @fileoverview Interface for the payload representing reserved seats for a particular session and user.
 *
 * @interface seats-reserved-payload-interface
 */
/**
 * Payload representing reserved seats for a particular session and user.
 *
 * @interface ISeatsReservedPayload
 * @property {string} sessionId - The unique identifier of the session.
 * @property {string} userId - The unique identifier of the user reserving the seats.
 * @property {Array<string>} seatIds - The list of seat IDs that have been reserved.
 */
export interface ISeatsReservedPayload {
  sessionId: string;
  userId: string;
  seatIds: Array<string>;
}
