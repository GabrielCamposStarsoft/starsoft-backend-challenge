/**
 * Input interface for updating a session.
 *
 * All fields except id are optional (partial update).
 *
 * @property {string} id - The unique identifier of the session to update.
 * @property {string} [movieTitle] - The title of the movie for the session.
 * @property {string} [roomName] - The name of the room where the session is scheduled.
 * @property {string} [startTime] - Session start time (ISO 8601).
 * @property {string} [endTime] - Session end time (ISO 8601).
 * @property {number} [ticketPrice] - Ticket price in BRL.
 */
export interface IUpdateSessionsInput {
  id: string;
  movieTitle?: string;
  roomName?: string;
  startTime?: string;
  endTime?: string;
  ticketPrice?: number;
}
