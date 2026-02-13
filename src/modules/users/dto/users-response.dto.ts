/**
 * @fileoverview Response DTO for a user.
 *
 * @dto users-response
 */
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from 'src/common';

/**
 * DTO de resposta representando um usuário.
 *
 * @description
 * Returned in GET /auth/me, POST /auth/register and UsersService.create.
 *
 * @see AuthController.me
 * @see AuthController.register
 * @see UsersService
 */
export class UsersResponseDto {
  @ApiProperty({
    description: 'User unique identifier',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Username',
    example: 'johndoe',
  })
  username: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john@example.com',
    format: 'email',
  })
  email: string;

  @ApiProperty({
    description: 'User role',
    enum: UserRole,
    example: UserRole.USER,
  })
  role: UserRole;

  @ApiProperty({
    description: 'Creation date (ISO 8601)',
    example: '2026-02-10T14:30:00.000Z',
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update date (ISO 8601)',
    example: '2026-02-10T14:30:00.000Z',
    format: 'date-time',
  })
  updatedAt: Date;
}
