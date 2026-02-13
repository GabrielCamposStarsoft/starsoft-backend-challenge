/**
 * @fileoverview Response DTO for a seat.
 *
 * @dto seats-response
 */
import { ApiProperty } from '@nestjs/swagger';
import { SeatStatus } from '../enums';

/**
 * DTO de resposta representando um assento.
 *
 * @description
 * Returned in GET /seats and POST /seats.
 *
 * @see SeatsController
 * @see SeatsService
 */
export class SeatsResponseDto {
  /**
   * Seat unique identifier.
   * @type {string}
   * @example "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
   */
  @ApiProperty({
    description: 'Seat unique identifier',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    format: 'uuid',
  })
  id: string;

  /**
   * The UUID of the session this seat belongs to.
   * @type {string}
   * @example "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
   */
  @ApiProperty({
    description: 'Session UUID',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    format: 'uuid',
  })
  sessionId: string;

  /**
   * Seat label (e.g., A1, B3).
   * @type {string}
   * @example "A1"
   */
  @ApiProperty({
    description: 'Seat label (e.g. A1, B3)',
    example: 'A1',
  })
  label: string;

  /**
   * Current seat status.
   * @type {SeatStatus}
   * @example SeatStatus.AVAILABLE
   */
  @ApiProperty({
    description: 'Seat status',
    enum: SeatStatus,
    example: SeatStatus.AVAILABLE,
  })
  status: SeatStatus;

  /**
   * Version for optimistic locking.
   * @type {number}
   * @example 1
   */
  @ApiProperty({
    description: 'Version for optimistic locking',
    example: 1,
  })
  version: number;

  /**
   * The ISO8601 creation date of this seat.
   * @type {Date}
   * @example "2026-02-10T14:30:00.000Z"
   */
  @ApiProperty({
    description: 'Creation date (ISO 8601)',
    example: '2026-02-10T14:30:00.000Z',
    format: 'date-time',
  })
  createdAt: Date;

  /**
   * The ISO8601 last update date of this seat.
   * @type {Date}
   * @example "2026-02-10T14:30:00.000Z"
   */
  @ApiProperty({
    description: 'Last update date (ISO 8601)',
    example: '2026-02-10T14:30:00.000Z',
    format: 'date-time',
  })
  updatedAt: Date;
}
