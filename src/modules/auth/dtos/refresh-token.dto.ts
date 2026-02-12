/**
 * @fileoverview DTO for refreshing an access token.
 *
 * @dto refresh-token
 */
import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO for refreshing the access token.
 *
 * @description
 * Contains the refresh token returned on login to obtain a new access token.
 * Used in endpoint POST /auth/refresh (requires JwtRefreshGuard).
 *
 * @example
 * ```json
 * {
 *   "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * }
 * ```
 *
 * @see AuthController.refresh
 * @see AuthService.refresh
 */
@ApiExtraModels(RefreshTokenDto)
export class RefreshTokenDto {
  /**
   * Refresh token (JWT) retornado no login.
   *
   * @example 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
   */
  @ApiProperty({
    description:
      'Refresh token (JWT) returned on login; used to obtain a new access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
