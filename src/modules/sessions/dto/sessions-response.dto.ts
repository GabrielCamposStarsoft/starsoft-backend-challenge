/**
 * @fileoverview Response DTO for a session.
 *
 * @dto sessions-response
 */
import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';
import { SessionStatus } from '../enums';

/**
 * DTO de resposta representando uma sessão de cinema.
 *
 * @description
 * Returned in GET /sessions, GET /sessions/:id and POST /sessions.
 *
 * @see SessionsController
 * @see SessionsService
 */
@ApiExtraModels(SessionsResponseDto)
export class SessionsResponseDto {
  /**
   * Session unique identifier
   * @example 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
   * @format uuid
   */
  @ApiProperty({
    description: 'Session unique identifier',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    format: 'uuid',
  })
  id: string;

  /**
   * Movie title
   * @example 'Interstellar'
   */
  @ApiProperty({
    description: 'Movie title',
    example: 'Interstellar',
  })
  movieTitle: string;

  /**
   * Room name
   * @example 'Sala 1'
   */
  @ApiProperty({
    description: 'Room name',
    example: 'Sala 1',
  })
  roomName: string;

  /**
   * Session start time (ISO 8601)
   * @example '2026-03-15T19:00:00.000Z'
   * @format date-time
   */
  @ApiProperty({
    description: 'Session start time (ISO 8601)',
    example: '2026-03-15T19:00:00.000Z',
    format: 'date-time',
  })
  startTime: Date;

  /**
   * Session end time (ISO 8601)
   * @example '2026-03-15T21:30:00.000Z'
   * @format date-time
   */
  @ApiProperty({
    description: 'Session end time (ISO 8601)',
    example: '2026-03-15T21:30:00.000Z',
    format: 'date-time',
  })
  endTime: Date;

  /**
   * Ticket price in BRL
   * @example 25.0
   * @minimum 0
   */
  @ApiProperty({
    description: 'Ticket price in BRL',
    example: 25.0,
    minimum: 0,
  })
  ticketPrice: number;

  /**
   * Session status
   * @example SessionStatus.ACTIVE
   */
  @ApiProperty({
    description: 'Session status',
    enum: SessionStatus,
    example: SessionStatus.ACTIVE,
  })
  status: SessionStatus;

  /**
   * Creation date (ISO 8601)
   * @example '2026-02-10T14:30:00.000Z'
   * @format date-time
   */
  @ApiProperty({
    description: 'Creation date (ISO 8601)',
    example: '2026-02-10T14:30:00.000Z',
    format: 'date-time',
  })
  createdAt: Date;

  /**
   * Last update date (ISO 8601)
   * @example '2026-02-10T14:30:00.000Z'
   * @format date-time
   */
  @ApiProperty({
    description: 'Last update date (ISO 8601)',
    example: '2026-02-10T14:30:00.000Z',
    format: 'date-time',
  })
  updatedAt: Date;
}
