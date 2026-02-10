import { ApiProperty } from '@nestjs/swagger';

export class UsersResponseDto {
  @ApiProperty({
    description: 'Unique identifier',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  id: string;

  @ApiProperty({ description: 'Username', example: 'johndoe' })
  username: string;

  @ApiProperty({ description: 'User email', example: 'john@example.com' })
  email: string;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}
