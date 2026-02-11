/**
 * DTO for creating multiple reservations in a single request.
 *
 * This DTO is used to specify the required information for reserving multiple seats in a session
 * for a particular user. Includes the session ID, user ID, and an array of seat IDs.
 *
 * @class CreateReservationsDto
 * @property {string} sessionId - The ID of the session in which the seats are being reserved.
 * @property {string[]} seatIds - An array of seat UUIDs to reserve in the session.
 * @property {string} userId - The ID of the user making the reservation(s).
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateReservationsDto {
  /**
   * The ID of the session in which the seats are being reserved.
   * @type {string}
   * @example "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
   */
  @ApiProperty({
    description: 'Session ID',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsUUID()
  @IsNotEmpty()
  sessionId: string;

  /**
   * An array of UUIDs, each representing a seat to reserve in the session.
   * @type {string[]}
   * @example ["a1b2c3d4-e5f6-7890-abcd-ef1234567890"]
   */
  @ApiProperty({
    description: 'Array of seat IDs to reserve',
    example: ['a1b2c3d4-e5f6-7890-abcd-ef1234567890'],
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsNotEmpty()
  seatIds: string[];
}
