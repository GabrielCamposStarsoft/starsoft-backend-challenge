import type { Optional } from 'src/common';
import type { IRefreshTokenBody } from './refresh-token-body.interface';

/**
 * @interface IRequestWithRefreshToken
 * @description
 * Interface representing a request that may optionally contain a body with a refresh token.
 *
 * @property {Optional<IRefreshTokenBody>} [body] - Optional request body containing a refresh token.
 */
export interface IRequestWithRefreshToken {
  body?: Optional<IRefreshTokenBody>;
}
