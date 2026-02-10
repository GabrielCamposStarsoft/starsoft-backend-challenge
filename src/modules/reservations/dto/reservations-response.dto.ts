import { ApiProperty } from '@nestjs/swagger';
import { ReservationStatus } from '../enums';

/**
 * DTO representing the response structure for a reservation.
 *
 * @class ReservationsResponseDto
 * @property {string} id - Unique identifier for the reservation.
 * @property {string} sessionId - ID of the session to which the reservation belongs.
 * @property {string} seatId - ID of the seat reserved.
 * @property {string} userId - ID of the user who made the reservation.
 * @property {ReservationStatus} status - Current status of the reservation.
 * @property {Date} expiresAt - Timestamp when the reservation expires.
 * @property {Date} createdAt - Timestamp when the reservation was created.
 * @property {Date} updatedAt - Timestamp of the last reservation update.
 */
export class ReservationsResponseDto {
  /**
   * Unique identifier for the reservation.
   */
  @ApiProperty({ description: 'Unique identifier' })
  id: string;

  /**
   * ID of the session to which the reservation belongs.
   */
  @ApiProperty({ description: 'Session ID' })
  sessionId: string;

  /**
   * ID of the seat reserved.
   */
  @ApiProperty({ description: 'Seat ID' })
  seatId: string;

  /**
   * ID of the user who made the reservation.
   */
  @ApiProperty({ description: 'User ID' })
  userId: string;

  /**
   * Current status of the reservation.
   */
  @ApiProperty({
    description: 'Reservation status',
    enum: ReservationStatus,
  })
  status: ReservationStatus;

  /**
   * Timestamp when the reservation expires.
   */
  @ApiProperty({ description: 'Reservation expiration timestamp' })
  expiresAt: Date;

  /**
   * Timestamp when the reservation was created.
   */
  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  /**
   * Timestamp of the last reservation update.
   */
  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}
