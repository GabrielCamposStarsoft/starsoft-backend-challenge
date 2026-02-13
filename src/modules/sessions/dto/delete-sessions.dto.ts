import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty } from 'class-validator';

/**
 * Data Transfer Object for deleting a session.
 */
export class DeleteSessionsDto {
  /**
   * The ID of the session to delete.
   * @type {string}
   * @example "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
   */
  @ApiProperty({
    description: 'The ID of the session to delete.',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    format: 'uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  id: string;
}
