/**
 * @fileoverview DTO for user login.
 *
 * @dto login
 */

import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * DTO for user login.
 *
 * @description
 * Contains the required fields for authentication: email and password.
 * Used in endpoint POST /auth/login.
 *
 * @example
 * ```json
 * {
 *   "email": "user@example.com",
 *   "password": "Str0ngP@ss"
 * }
 * ```
 *
 * @see AuthController.login
 * @see AuthService.login
 */
@ApiExtraModels(LoginDto)
export class LoginDto {
  /**
   * Registered user email.
   *
   * @example 'user@example.com'
   */
  @ApiProperty({
    description: 'User email (must exist in the system)',
    example: 'user@example.com',
    format: 'email',
    required: true,
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  /**
   * User password.
   *
   * @example 'Str0ngP@ss'
   */
  @ApiProperty({
    description: 'Password used during registration',
    example: 'Str0ngP@ss',
    minLength: 1,
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1, { message: 'Password is required' })
  password: string;
}
