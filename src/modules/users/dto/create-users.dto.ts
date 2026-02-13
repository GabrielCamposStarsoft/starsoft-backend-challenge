/**
 * @fileoverview DTO for creating a user (admin/CRUD).
 *
 * @dto create-users
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
  MinLength,
} from 'class-validator';
import { type Optional, UserRole } from 'src/common';

/**
 * DTO for creating a user (admin/CRUD or registration).
 *
 * @description
 * Requires username, email and strong password. role is optional (default: user).
 * Used in POST /auth/register and UsersService.create.
 *
 * @example
 * ```json
 * {
 *   "username": "johndoe",
 *   "email": "john@example.com",
 *   "password": "Str0ngP@ss",
 *   "role": "user"
 * }
 * ```
 *
 * @see AuthController.register
 * @see UsersService.create
 */
export class CreateUsersDto {
  /**
   * Username (unique in the system).
   *
   * @example 'johndoe'
   */
  @ApiProperty({
    description: 'Username (must be unique)',
    example: 'johndoe',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  /**
   * User email address.
   *
   * @example 'john@example.com'
   */
  @ApiProperty({
    description: 'User email address',
    example: 'john@example.com',
    format: 'email',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  /**
   * Password (min. 8 characters, 1 number, 1 symbol, 1 uppercase, 1 lowercase).
   *
   * @example 'Str0ngP@ss'
   */
  @ApiProperty({
    description:
      'Password (min. 8 characters, 1 number, 1 symbol, 1 uppercase, 1 lowercase)',
    example: 'Str0ngP@ss',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @IsStrongPassword({
    minLength: 8,
    minNumbers: 1,
    minSymbols: 1,
    minUppercase: 1,
    minLowercase: 1,
  })
  password: string;

  @ApiPropertyOptional({
    description: 'User role (defaults to user)',
    enum: UserRole,
    example: UserRole.USER,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: Optional<UserRole>;
}
