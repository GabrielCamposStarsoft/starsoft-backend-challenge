/**
 * @fileoverview DTO for creating a seat in a session.
 *
 * @dto create-seats
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

/**
 * DTO for creating a seat in a session.
 *
 * @description
 * Requires ADMIN role. Used in endpoint POST /seats.
 *
 * @example
 * ```json
 * {
 *   "sessionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
 *   "label": "A1"
 * }
 * ```
 *
 * @see SeatsController.create
 * @see SeatsService.create
 */
export class CreateSeatsDto {
  /**
   * The UUID of the session to which the seat will be attached.
   *
   * @type {string}
   * @example "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
   */
  @ApiProperty({
    description: 'Session UUID to attach the seat to',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    format: 'uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  sessionId: string;

  /**
   * The seat label (e.g., row and number: A1, B3).
   *
   * @type {string}
   * @example "A1"
   */
  @ApiProperty({
    description: 'Seat label (e.g. row + number: A1, B3)',
    example: 'A1',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  label: string;
}
