/**
 * @fileoverview DTO for creating a cinema session.
 *
 * @dto create-sessions
 */
import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsDateString,
  Min,
} from 'class-validator';

/**
 * DTO for creating a cinema session (movie, room, schedule, price).
 *
 * @description
 * Requires ADMIN role. Used in endpoint POST /sessions.
 *
 * @example
 * ```json
 * {
 *   "movieTitle": "Interstellar",
 *   "roomName": "Sala 1",
 *   "startTime": "2026-03-15T19:00:00.000Z",
 *   "endTime": "2026-03-15T21:30:00.000Z",
 *   "ticketPrice": 25.0
 * }
 * ```
 *
 * @see SessionsController.create
 * @see SessionsService.create
 */
@ApiExtraModels(CreateSessionsDto)
export class CreateSessionsDto {
  /**
   * Movie title.
   *
   * @example 'Interstellar'
   */
  @ApiProperty({
    description: 'Movie title',
    example: 'Interstellar',
  })
  @IsString()
  @IsNotEmpty()
  movieTitle: string;

  /**
   * Room name.
   *
   * @example 'Sala 1'
   */
  @ApiProperty({
    description: 'Room name',
    example: 'Sala 1',
  })
  @IsString()
  @IsNotEmpty()
  roomName: string;

  /**
   * Session start time (ISO 8601).
   *
   * @example '2026-03-15T19:00:00.000Z'
   */
  @ApiProperty({
    description: 'Start time (ISO 8601)',
    example: '2026-03-15T19:00:00.000Z',
    format: 'date-time',
  })
  @IsDateString()
  @IsNotEmpty()
  startTime: string;

  /**
   * Session end time (ISO 8601).
   *
   * @example '2026-03-15T21:30:00.000Z'
   */
  @ApiProperty({
    description: 'End time (ISO 8601)',
    example: '2026-03-15T21:30:00.000Z',
    format: 'date-time',
  })
  @IsDateString()
  @IsNotEmpty()
  endTime: string;

  /**
   * Ticket price in BRL.
   *
   * @example 25.0
   */
  @ApiProperty({
    description: 'Ticket price in BRL',
    example: 25.0,
    minimum: 0.01,
  })
  @IsNumber()
  @Min(0.01)
  ticketPrice: number;
}
