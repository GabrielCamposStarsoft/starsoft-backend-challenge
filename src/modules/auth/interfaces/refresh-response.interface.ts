/**
 * @interface IRefreshResponse
 * @description
 * Interface representing the response body for a successful token refresh.
 *
 * @property {string} accessToken - The access token.
 * @property {number} expiresIn - The expiration time in milliseconds.
 */
export interface IRefreshResponse {
  accessToken: string;
  expiresIn: number;
}
