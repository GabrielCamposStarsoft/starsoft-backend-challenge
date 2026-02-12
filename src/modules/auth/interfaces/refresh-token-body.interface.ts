import type { Optional } from 'src/common';

/**
 * Interface representing the body of a refresh token request.
 *
 * @interface IRefreshTokenBody
 * @property {Optional<string>} refreshToken - The refresh token to be used for token refresh.
 */
export interface IRefreshTokenBody {
  refreshToken?: Optional<string>;
}
