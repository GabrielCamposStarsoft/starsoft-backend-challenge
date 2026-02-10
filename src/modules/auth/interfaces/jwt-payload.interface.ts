/**
 * Payload embedded in the JWT access token.
 */
export interface IJwtAccessPayload {
  sub: string;
  email: string;
  type: 'access';
}

/**
 * Payload embedded in the JWT refresh token.
 */
export interface IJwtRefreshPayload {
  sub: string;
  email: string;
  type: 'refresh';
  tokenId: string;
}

/**
 * User info attached to request after JWT validation.
 */
export interface IRequestUser {
  id: string;
  email: string;
}
