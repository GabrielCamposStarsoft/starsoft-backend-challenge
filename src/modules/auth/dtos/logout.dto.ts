/**
 * @fileoverview DTO for user logout.
 *
 * @dto logout
 */
import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO for user logout.
 *
 * @description
 * Contains the refresh token that will be invalidated on logout.
 * Used in endpoint POST /auth/logout.
 *
 * @example
 * ```json
 * {
 *   "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * }
 * ```
 *
 * @see AuthController.logout
 * @see AuthService.logout
 */
@ApiExtraModels(LogoutDto)
export class LogoutDto {
  /**
   * Refresh token retornado no login a ser invalidado.
   *
   * @example 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
   */
  @ApiProperty({
    description:
      'Refresh token (JWT) retornado no login; será invalidado e não poderá mais ser usado',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
