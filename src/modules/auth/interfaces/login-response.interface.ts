/**
 * @interface ILoginResponse
 * @description
 * Interface representing the response body for a successful login.
 *
 * @property {string} accessToken - The access token.
 * @property {string} refreshToken - The refresh token.
 * @property {number} expiresIn - The expiration time in milliseconds.
 */
export interface ILoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
