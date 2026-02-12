/**
 * @interface IJwtRefreshPayload
 * @description
 * Interface representing the payload embedded in the JWT refresh token.
 *
 * @property {string} sub - Subject identifier, usually the user's unique ID.
 * @property {string} email - The email address of the user.
 * @property {'refresh'} type - Token type, always 'refresh' for refresh tokens.
 * @property {string} tokenId - The ID of the refresh token.
 */
export interface IJwtRefreshPayload {
  sub: string;
  email: string;
  type: 'refresh';
  tokenId: string;
}
