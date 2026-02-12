/**
 * @fileoverview Response DTO for a reservation.
 *
 * @dto reservations-response
 */
import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';
import { ReservationStatus } from '../enums';

/**
 * Response DTO representing a reservation.
 *
 * @description
 * Returned in GET /reservations, GET /reservations/:id and POST /reservations.
 *
 * @see ReservationsController
 * @see ReservationsService
 */
@ApiExtraModels(ReservationsResponseDto)
export class ReservationsResponseDto {
  /**
   * Reservation unique identifier
   * @type {string}
   * @example "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
   * @format uuid
   */
  @ApiProperty({
    description: 'Reservation unique identifier',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    format: 'uuid',
  })
  id: string;

  /**
   * UUID of the session associated with this reservation.
   * @type {string}
   * @example "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
   * @format uuid
   */
  @ApiProperty({
    description: 'Session UUID',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    format: 'uuid',
  })
  sessionId: string;

  /**
   * UUID of the seat reserved.
   * @type {string}
   * @example "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
   * @format uuid
   */
  @ApiProperty({
    description: 'Seat UUID',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    format: 'uuid',
  })
  seatId: string;

  /**
   * UUID of the user who made the reservation.
   * @type {string}
   * @example "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
   * @format uuid
   */
  @ApiProperty({
    description: 'User UUID who made the reservation',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    format: 'uuid',
  })
  userId: string;

  /**
   * Status of the reservation.
   * @type {ReservationStatus}
   * @example ReservationStatus.PENDING
   */
  @ApiProperty({
    description: 'Reservation status',
    enum: ReservationStatus,
    example: ReservationStatus.PENDING,
  })
  status: ReservationStatus;

  /**
   * Expiration timestamp (ISO 8601 string) for the reservation.
   * @type {Date}
   * @example "2026-02-10T15:00:00.000Z"
   * @format date-time
   */
  @ApiProperty({
    description: 'Expiration timestamp (ISO 8601)',
    example: '2026-02-10T15:00:00.000Z',
    format: 'date-time',
  })
  expiresAt: Date;

  /**
   * Date and time when the reservation was created (ISO 8601 string).
   * @type {Date}
   * @example "2026-02-10T14:30:00.000Z"
   * @format date-time
   */
  @ApiProperty({
    description: 'Creation date (ISO 8601)',
    example: '2026-02-10T14:30:00.000Z',
    format: 'date-time',
  })
  createdAt: Date;

  /**
   * Date and time when the reservation was last updated (ISO 8601 string).
   * @type {Date}
   * @example "2026-02-10T14:30:00.000Z"
   * @format date-time
   */
  @ApiProperty({
    description: 'Last update date (ISO 8601)',
    example: '2026-02-10T14:30:00.000Z',
    format: 'date-time',
  })
  updatedAt: Date;
}
