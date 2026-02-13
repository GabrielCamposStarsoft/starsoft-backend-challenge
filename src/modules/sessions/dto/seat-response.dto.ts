/**
 * @fileoverview Response DTO for a seat.
 *
 * @dto seat-response
 */
import { ApiProperty } from '@nestjs/swagger';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
} from 'class-validator';
import { SeatStatus } from 'src/modules/seats/enums';

/**
 * DTO representing a seat response.
 *
 * Returned by GET /sessions/:id/seats.
 *
 * @see SessionsController
 * @see SessionsService
 */
export class SeatResponseDto {
  /**
   * Seat unique identifier (UUID)
   * @example "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
   */
  @ApiProperty({
    description: 'Seat unique identifier',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    format: 'uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  id: string;

  /**
   * Session UUID this seat belongs to
   * @example "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
   */
  @ApiProperty({
    description: 'Session UUID',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    format: 'uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  sessionId: string;

  /**
   * Seat label (e.g. "A1", "B3")
   * @example "A1"
   */
  @ApiProperty({
    description: 'Seat label (e.g. A1, B3)',
    example: 'A1',
  })
  @IsString()
  @IsNotEmpty()
  label: string;

  /**
   * Current seat status
   * @example SeatStatus.AVAILABLE
   */
  @ApiProperty({
    description: 'Seat status',
    enum: SeatStatus,
    example: SeatStatus.AVAILABLE,
  })
  @IsEnum(SeatStatus)
  @IsNotEmpty()
  status: SeatStatus;

  /**
   * Version for optimistic locking
   * @example 1
   */
  @ApiProperty({
    description: 'Version for optimistic locking',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  version: number;

  /**
   * Creation date (ISO 8601)
   * @example "2026-02-10T14:30:00.000Z"
   */
  @ApiProperty({
    description: 'Creation date (ISO 8601)',
    example: '2026-02-10T14:30:00.000Z',
    format: 'date-time',
  })
  @IsDate()
  @IsNotEmpty()
  createdAt: Date;

  /**
   * Last update date (ISO 8601)
   * @example "2026-02-10T14:30:00.000Z"
   */
  @ApiProperty({
    description: 'Last update date (ISO 8601)',
    example: '2026-02-10T14:30:00.000Z',
    format: 'date-time',
  })
  @IsDate()
  @IsNotEmpty()
  updatedAt: Date;
}
