/**
 * @fileoverview DTO for user registration.
 *
 * @dto register
 */
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsStrongPassword,
} from 'class-validator';

/**
 * DTO for user registration.
 *
 * @description
 * Contains the required fields for account creation: email and password.
 * Password must have at least 8 characters, 1 number, 1 symbol, 1 uppercase and 1 lowercase.
 * Used in endpoint POST /auth/register.
 *
 * @example
 * ```json
 * {
 *   "email": "user@example.com",
 *   "password": "Str0ngP@ss"
 * }
 * ```
 *
 * @see AuthController.register
 * @see AuthService.register
 */
export class RegisterDto {
  /**
   * User email (unique in the system).
   *
   * @example 'user@example.com'
   */
  @ApiProperty({
    description: 'User email (must be unique)',
    example: 'user@example.com',
    format: 'email',
    required: true,
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  /**
   * Password with security requirements.
   *
   * @example 'Str0ngP@ss'
   */
  @ApiProperty({
    description:
      'Password (min. 8 characters, 1 number, 1 symbol, 1 uppercase, 1 lowercase)',
    example: 'Str0ngP@ss',
    minLength: 8,
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @IsStrongPassword(
    {
      minLength: 8,
      minNumbers: 1,
      minSymbols: 1,
      minUppercase: 1,
      minLowercase: 1,
    },
    {
      message:
        'Password must contain at least 1 number, 1 symbol, 1 uppercase and 1 lowercase letter',
    },
  )
  password: string;
}
