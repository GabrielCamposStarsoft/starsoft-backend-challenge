/**
 * @fileoverview DTO for creating seat reservations in a session.
 *
 * @dto create-reservations
 */
import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsUUID,
} from 'class-validator';

/**
 * DTO for creating a reservation of one or more seats in a session.
 *
 * @description
 * Contains sessionId and array of seatIds. UserId is extracted from the authenticated JWT.
 * Used in endpoint POST /reservations.
 *
 * @example
 * ```json
 * {
 *   "sessionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
 *   "seatIds": ["a1b2c3d4-e5f6-7890-abcd-ef1234567890", "b2c3d4e5-f6a7-8901-bcde-f12345678901"]
 * }
 * ```
 *
 * @see ReservationsController.create
 * @see ReservationsService.create
 */
@ApiExtraModels(CreateReservationsDto)
export class CreateReservationsDto {
  /**
   * UUID of the session in which seats will be reserved.
   *
   * @example 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
   */
  @ApiProperty({
    description:
      'Unique identifier (UUID) of the session in which seats are to be reserved.',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    format: 'uuid',
    required: true,
  })
  @IsUUID('4', { message: 'sessionId must be a valid UUID v4' })
  @IsNotEmpty({ message: 'sessionId must not be empty' })
  sessionId: string;

  /**
   * Array of seat UUIDs to reserve in the session. Between 1 and 20 items.
   *
   * @example ['a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b2c3d4e5-f6a7-8901-bcde-f12345678901']
   */
  @ApiProperty({
    description:
      'Array of unique seat UUIDs to reserve within the session. 1-20 items allowed.',
    example: [
      'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    ],
    type: String,
    isArray: true,
    minItems: 1,
    maxItems: 20,
    required: true,
    uniqueItems: true,
  })
  @IsArray({ message: 'seatIds must be an array of UUID strings' })
  @ArrayMinSize(1, {
    message:
      'At least one seat must be selected (seatIds must have at least 1 item)',
  })
  @ArrayMaxSize(20, {
    message: 'Cannot reserve more than 20 seats in a single request',
  })
  @IsUUID('4', { each: true, message: 'Each seatId must be a valid UUID v4' })
  @IsNotEmpty({ message: 'seatIds array must not be empty' })
  seatIds: Array<string>;
}
